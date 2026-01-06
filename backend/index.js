import express from "express";
import multer from "multer";
import supabase from "./database/supabase.js";
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

    try {
        //insert into files
        const { data: file, error: fileError } = await supabase
            .from("files")
            .insert({
                file_name: originalName,
                mimetype: mimeType,
                total_size: totalSize
            })
            .select()
            .single();

        if (fileError) throw fileError;

        const fileId = file.id;

        //insert into chunks
        const chunksToInsert = chunkData.map(chunk => ({
            file_id: fileId,
            chunk_index: chunk.partNumber,
            telegram_file_id: chunk.telegramFileId
        }));

        const { error: chunkError } = await supabase
            .from("file_chunks")
            .insert(chunksToInsert);

        if (chunkError) throw chunkError;

        console.log("Database updated successfully");

        // cleanup temp files
        fs.unlinkSync(filePath);
        console.log("Deleted temp files");

    } catch (error) {
        console.error("Error writing to Supabase:", error);
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
        const {data, error} = await supabase
            .from("files")
            .select("*")
            .order("uploaded_at", { ascending: false });


        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: "failed to fetch files" });
        }

        return res.json(data);
    }catch(error){
        console.log("Error fetching files from db: "+error);
        return res.status(500).json({error: "failed to fetch files"});
    }
});

app.get("/files/stats", async (req, res) => {
    const bytesToGB = (bytes) =>
        bytes ? (bytes / (1024 ** 3)).toFixed(2) : "0.00";

    try {
        const { data, error } = await supabase
            .from("files")
            .select("total_size");

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: "failed to fetch files stats" });
        }
        const totalBytes = data.reduce(
            (sum, row) => sum + (row.total_size || 0),
            0
        );
        const totalGB = bytesToGB(totalBytes);

        return res.json({ totalGB });
    } catch (err) {
        console.error("Error fetching files stats:", err);
        return res.status(500).json({ error: "failed to fetch files stats" });
    }

});
//finish moving to supabase from here below
app.get("/download/:fileId", async (req, res) => {
    try {
        const {fileId} = req.params;

        const {data:  telegramFileIds, error} = await supabase
            .from("file_chunks")
            .select("telegram_file_id")
            .eq("file_id", fileId)
            .order("chunk_index", { ascending: true });
        if(error){
            console.log("Error fetching chunks"+error);
            return res.status(500).send("Failed to fetch file chunks");
        }

        if (telegramFileIds.length === 0) return res.status(404).send("No telegram file found.");

        const {data: fileInfo, error: err2} = await supabase
            .from("files")
            .select("file_name, mimetype")
            .eq("id", fileId)
            .single();

        if(err2){
            console.error("Error fetching file info: ", err);
            return res.status(500).send("Failed to fetch file info");
        }
        console.log(fileInfo);
        if (!fileInfo) return res.status(404).send("File not found");

        //set headers to tell browser to download the file and not display it
        const safeName = encodeURIComponent(fileInfo.file_name);
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');

        for (const item of telegramFileIds) {
            // Get the buffer for this chunk
            const chunkBuffer = await getChunkBuffer(item.telegram_file_id);

            // Send it directly to the user's browser
            res.write(chunkBuffer);
        }

        // End the stream
        res.end();
    }catch(error){
        console.error("Download Stream Error:", error);
        if (!res.headersSent) res.status(500).send("Error downloading file");
        else res.end();
    }
})

app.get("/search", async (req, res) => {
    const query = req.query.q;
    let data, error;
    if (!query || !query.trim()) {
        return res.json([]);
    }
    try {
        //use FTS only for querys of length >= 5 otherwise use ilike
        if (query.length >= 5) {
            // Full-text search
            ({ data, error } = await supabase
                .from("files")
                .select("*")
                .textSearch("search_vector", query, {
                    type: "websearch",
                    config: "english"
                }));
        } else {
            // Prefix fallback
            ({ data, error } = await supabase
                .from("files")
                .select("*")
                .ilike("file_name", `${query}%`));
        }

        if (error) {
            console.log(error.message);
        }
        res.json(data);

    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});


app.listen(8080, () => console.log("Server started on port 8080"));