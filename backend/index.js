import express from "express";
import Busboy from "busboy";
import supabase from "./database/supabase.js";
import {sendFile, getChunkBuffer} from "./bot.js";
import crypto from "crypto";
import cors from "cors";
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false
});

const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
app.use(limiter);

const API_KEY = process.env.SECRET_KEY;

app.use((req, res, next) => {
    const userKey = req.headers['x-api-key'] || req.query.api_key;

    if (req.path === '/health') return next();

    if (userKey === API_KEY) {
        next();
    } else {
        res.status(401).send("Private: API Key Required");
    }
});


const uploadProgress = new Map();
setInterval(() => {

    const now = Date.now();
    const MAX_AGE = 10 * 60 * 1000; // 10 minutes

    for (const [uploadId, data] of uploadProgress.entries()) {

        if (now - data.createdAt > MAX_AGE) {
            console.log("Cleaning stale upload:", uploadId);
            uploadProgress.delete(uploadId);
        }

    }

}, 60 * 1000); // run clean up job every minute

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20
});

app.post("/upload", uploadLimiter, (req, res) => {

    const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: 2 * 1024 * 1024 * 1024 }
    });

    const totalBytes = parseInt(req.headers["content-length"] || "0");
    const uploadId = crypto.randomUUID();
    const CHUNK_SIZE = 17 * 1024 * 1024;
    let buffer = Buffer.alloc(0);
    let partNumber = 0;
    let totalSize = 0;

    let originalName = "";
    let mimeType = "";

    let chunkData = [];

    uploadProgress.set(uploadId, {
        uploadedBytes: 0,
        totalBytes: totalBytes,
        fileName: "",
        createdAt: Date.now()
    });

    res.json({ uploadId });

    busboy.on("file", (fieldname, file, info) => {

        originalName = info.filename;
        mimeType = info.mimeType;

        uploadProgress.set(uploadId, {
            ...uploadProgress.get(uploadId),
            fileName: originalName
        });
        file.on("limit", () => {

            console.log("File too large");

            uploadProgress.set(uploadId, {
                ...uploadProgress.get(uploadId),
                error: true
            });

        });
        file.on("data", async (data) => {

            file.pause();   // pause incoming stream

            try {

                totalSize += data.length;

                uploadProgress.set(uploadId, {
                    ...uploadProgress.get(uploadId),
                    uploadedBytes: totalSize
                });

                buffer = Buffer.concat([buffer, data], buffer.length + data.length);

                while (buffer.length >= CHUNK_SIZE) {

                    const chunk = buffer.slice(0, CHUNK_SIZE);
                    buffer = buffer.slice(CHUNK_SIZE);

                    partNumber++;

                    const telegramFileId = await sendFile(
                        chunk,
                        `${originalName}.part${partNumber}`
                    );

                    chunkData.push({
                        partNumber,
                        telegramFileId
                    });

                    uploadProgress.set(uploadId, {
                        ...uploadProgress.get(uploadId),
                        current: partNumber
                    });
                }

            } catch (err) {

                uploadProgress.set(uploadId, {
                    ...uploadProgress.get(uploadId),
                    error: true
                });

                console.error("Chunk upload failed:", err);
            }

            file.resume(); // resume stream
        });

        file.on("end", async () => {

            if (buffer.length > 0) {

                partNumber++;

                const telegramFileId = await sendFile(
                    buffer,
                    `${originalName}.part${partNumber}`
                );

                chunkData.push({
                    partNumber,
                    telegramFileId
                });

                uploadProgress.set(uploadId, {
                    ...uploadProgress.get(uploadId),
                    current: partNumber
                });
            }

            uploadProgress.set(uploadId, {
                ...uploadProgress.get(uploadId),
                totalBytes: totalSize,
                done: true
            });

            setTimeout(() => {
                uploadProgress.delete(uploadId);
            }, 60000);

            try {

                const { data: fileRow, error } = await supabase
                    .from("files")
                    .insert({
                        file_name: originalName,
                        mimetype: mimeType,
                        total_size: totalSize
                    })
                    .select()
                    .single();

                if (error) throw error;

                const chunksToInsert = chunkData.map(chunk => ({
                    file_id: fileRow.id,
                    chunk_index: chunk.partNumber,
                    telegram_file_id: chunk.telegramFileId
                }));

                await supabase
                    .from("file_chunks")
                    .insert(chunksToInsert);

                console.log("Database updated successfully");

            } catch (err) {
                console.error("Database write failed:", err);
            }

        });

    });

    busboy.on("error", err => {

        console.error("Upload stream error:", err);

        uploadProgress.set(uploadId, {
            ...uploadProgress.get(uploadId),
            error: true
        });

    });

    req.pipe(busboy);

});

app.get("/upload/status/:uploadId", (req, res) => {
    const { uploadId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const interval = setInterval(() => {
        const data = uploadProgress.get(uploadId);
        if (!data) return;

        const percent = data.totalBytes
            ? Math.round((data.uploadedBytes / data.totalBytes) * 100)
            : 0;

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
            console.error("Error fetching file info: ", err2);
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
        //use FTS only for querys of length >= 8 otherwise use ilike
        if (query.length >= 8) {
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
                .ilike("file_name", `%${query}%`));
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
//used by cron-job to keep deployment active
app.get("/health", (req, res)=>{
    res.status(200).send("OK");
})

app.use((err, req, res, next) => {
    console.log(err);
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            error: "File too large. Max size is 2GB"
        });
    }

    console.error(err);

    res.status(500).json({
        error: "Internal server error"
    });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
});