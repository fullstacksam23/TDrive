import express from "express";
import multer from "multer";
import db from "./database/db.js";
import {sendFile} from "./bot.js";
import crypto from "crypto";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
const upload = multer({ dest: 'uploads/' });

app.post("/upload", upload.single("file"), async (req, res) => {
    console.log(req.file);

    const CHUNK_SIZE = 45 * 1024 * 1024;
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const totalSize = req.file.size;
    const originalName = req.file.originalname;
    const stream = fs.createReadStream(filePath, {highWaterMark: CHUNK_SIZE});

    let partNumber = 0;
    let chunkData = [];
    try {
        for await (const chunk of stream) {
            partNumber++;

            // Generate safe unique filename for telegram
            const uniqueSuffix = crypto.randomBytes(4).toString("hex");
            const chunkName = `${originalName}.part${partNumber}-${uniqueSuffix}`;

            // upload chunk to telegram
            const telegramFileId = await sendFile(chunk, chunkName);

            if (!telegramFileId) {
                throw new Error(`Chunk ${partNumber} failed to upload`);
            }
            console.log(`Processed part ${partNumber}, size: ${chunk.length} bytes, telegramFileId: ${telegramFileId}`);
            chunkData.push({partNumber, telegramFileId, chunkName});
        }

        console.log("File uploaded");
    }catch(error){
        console.log("Error chunking file: "+error);
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

        return res.json({
            message: "Upload complete",
            file_id: fileId,
            parts: partNumber
        });

    }catch(error){
        console.log("Error writing to db: "+error);
    }

});
app.get("/files", async (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM files").all();
        console.log(rows);
        return res.json(rows);
    }catch(error){
        console.log("Error fetching files from db: "+error);
        return res.status(500).json({error: "failed to fetch files"});
    }
});

app.listen(8080, () => console.log("Server started on port 8080"));