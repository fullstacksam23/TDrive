import express from "express";
import Busboy from "busboy";
import supabase from "./database/supabase.js";
import {sendFile, getChunkStream} from "./bot.js";
import crypto from "crypto";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {uploadQueue, setUploadProgress, getUploadProgress, deleteUploadProgress, connection} from "./redis.js";
import fs from "fs";
import path from "path";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false
});

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

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

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20
});
connection.on("connect", () => {
    console.log("Redis connected");
});

app.post("/upload", uploadLimiter, async (req, res) => {

    const busboy = Busboy({ headers: req.headers });

    const uploadId = crypto.randomUUID();
    const uploadPath = path.join("uploads", uploadId);

    let totalSize = 0;
    let originalName = "";
    let mimeType = "";

    await setUploadProgress(uploadId, {
        uploadedBytes: 0,
        totalBytes: 1, // prevents NaN in progress bar
        fileName: ""
    });

    res.json({ uploadId });

    busboy.on("file", (fieldname, file, info) => {

        originalName = info.filename;
        mimeType = info.mimeType;

        const writeStream = fs.createWriteStream(uploadPath);

        file.on("data", async (data) => {
            totalSize += data.length;
        });

        file.pipe(writeStream);

        writeStream.on("finish", async () => {

            await uploadQueue.add("processUpload", {
                uploadId,
                filePath: uploadPath,
                fileName: originalName,
                mimeType,
                totalSize
            });

        });

    });

    req.pipe(busboy);

});

app.get("/upload/status/:uploadId", (req, res) => {
    const { uploadId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // prevents proxy buffering

    const interval = setInterval(async () => {
        try {
            const data = await getUploadProgress(uploadId);
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
                await deleteUploadProgress(uploadId);
                res.end();
            }
        }catch (err){
            console.error("SSE error:", err);
        }
    }, 500);
    // stop interval if client disconnects
    req.on("close", () => {
        clearInterval(interval);
    });
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
    let clientDisconnected = false;

    res.on("aborted", () => {
        clientDisconnected = true;
        console.log("Client disconnected during download");
    });
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

        const CONCURRENCY = 4;

        for (let i = 0; i < telegramFileIds.length; i += CONCURRENCY) {

            const batch = telegramFileIds.slice(i, i + CONCURRENCY);

            const streams = await Promise.all(
                batch.map(item => getChunkStream(item.telegram_file_id))
            );

            for (const stream of streams) {
                if (clientDisconnected) {
                    stream.destroy();
                    break;
                }
                await new Promise((resolve, reject) => {
                    stream.pipe(res, { end: false });
                    stream.on("end", resolve);
                    stream.on("error", reject);

                });
            }
        }
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

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION");
    console.error(err);
    process.exit(1); // exit so process manager can restart
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("UNHANDLED REJECTION");
    console.error("Reason:", reason);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
});