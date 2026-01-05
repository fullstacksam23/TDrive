import express from "express";
import multer from "multer";
import db from "./database/db.js";
import {sendFile, getChunkBuffer} from "./bot.js";
import crypto from "crypto";
import fs from "fs";
import cors from "cors";


const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
const upload = multer({ dest: 'uploads/' });
const uploadProgress = new Map();




app.post("/upload", upload.single("file"), async (req, res) => {
    console.log(req.file);

    const uploadId = crypto.randomUUID();

    const CHUNK_SIZE = 17 * 1024 * 1024; // inc to 18 or 19 mb in future
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const totalSize = req.file.size;
    const originalName = req.file.originalname;
    const stream = fs.createReadStream(filePath, {highWaterMark: CHUNK_SIZE});
    const totalParts = Math.ceil(totalSize / CHUNK_SIZE);

    uploadProgress.set(uploadId, {
        current: 0,
        total: totalParts,
        fileName: originalName
    });

    res.json({ uploadId });

    let partNumber = 0;
    let chunkData = [];

    try {
        for await (const chunk of stream) {
            partNumber++;

            const telegramFileId = await sendFile(
                chunk,
                `${originalName}.part${partNumber}`
            );

            chunkData.push({ partNumber, telegramFileId });

            // Update progress into global map
            uploadProgress.set(uploadId, {
                current: partNumber,
                total: totalParts,
                fileName: originalName
            });
        }

        uploadProgress.set(uploadId, {
            ...uploadProgress.get(uploadId),
            done: true
        });

    } catch (err) {
        uploadProgress.set(uploadId, {
            ...uploadProgress.get(uploadId),
            error: true
        });
    }

    try{
        //Insert into files
        const insertFile = db.prepare("INSERT INTO files (file_name, mimetype, total_size) VALUES (?, ?, ?)");
        const fileResult = insertFile.run(originalName, mimeType, totalSize);
        const fileId = fileResult.lastInsertRowid;

        //Insert into chunks
        const insertChunk = db.prepare(`
            INSERT INTO file_chunks (file_id, chunk_index, telegram_file_id)
            VALUES (?, ?, ?)
        `);

        //Insert into files_search
        const insertSearch = db.prepare(`
            INSERT INTO files_search (file_id, file_name, tags, description)
            VALUES (?, ?, ?, ?)
        `);

        insertSearch.run(fileId, originalName, "", "");
        chunkData.forEach(chunk => {insertChunk.run(fileId, chunk.partNumber, chunk.telegramFileId);})
        console.log("Database updated successfully");

        fs.unlinkSync(filePath);
        console.log(`Deleted temp files`);


    }catch(error){
        console.log("Error writing to db: "+error);
    }

});

app.get("/upload/status/:uploadId", (req, res) => {
    const { uploadId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const interval = setInterval(() => {
        const data = uploadProgress.get(uploadId);
        if (!data) return;

        const percent = Math.round(
            (data.current / data.total) * 100
        );

        res.write(`data: ${JSON.stringify({
            fileName: data.fileName,
            progress: percent,
            done: data.done || false
        })}\n\n`);

        if (data.done || data.error) {
            clearInterval(interval);
            uploadProgress.delete(uploadId);
            res.end();
        }
    }, 500);
});




app.get("/files", async (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM files").all();
        return res.json(rows);
    }catch(error){
        console.log("Error fetching files from db: "+error);
        return res.status(500).json({error: "failed to fetch files"});
    }
});

app.get("/files/stats", async (req, res) => {
    const bytesToGB = (bytes) =>
        bytes ? (bytes / (1024 ** 3)).toFixed(2) : "0.00";

    try{
        const rows = db.prepare("SELECT SUM(total_size) AS totalBytes FROM files").get();
        const totalGB = bytesToGB(rows.totalBytes);
        return res.json(totalGB);
    }catch(error){
        console.log("Error fetching files stats from db: "+error);
        return res.status(500).json({error: "failed to fetch files"});
    }
})

app.get("/download/:fileId", async (req, res) => {
    try {
        const {fileId} = req.params;
        const stmt = db.prepare("SELECT telegram_file_id from file_chunks WHERE file_id = ?  ORDER BY chunk_index ASC");
        const telegramFileIds = stmt.all(fileId);
        if (telegramFileIds.length === 0) return res.status(404).send("No telegram file found.");
        console.log(telegramFileIds);

        const stmt2 = db.prepare("SELECT file_name, mimetype from files WHERE id = ?");
        const fileInfo = stmt2.get(fileId);
        if (!fileInfo) return res.status(404).send("File not found");

        //set headers to tell browser to download the file and not display it
        const safeName = encodeURIComponent(fileInfo.file_name);
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');

        for (const item of telegramFileIds) {
            console.log(`Streaming chunk: ${item.telegram_file_id}`);

            // Get the buffer for this chunk
            const chunkBuffer = await getChunkBuffer(item.telegram_file_id);

            // Send it directly to the user's browser
            res.write(chunkBuffer);
        }

        // 4. End the stream
        res.end();
    }catch(error){
        console.error("Download Stream Error:", error);
        if (!res.headersSent) res.status(500).send("Error downloading file");
        else res.end();
    }
})
app.listen(8080, () => console.log("Server started on port 8080"));