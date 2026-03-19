import express from "express";
import Busboy from "busboy";
import supabase from "./database/supabase.js";
import {bot} from "./bot.js";
import crypto from "crypto";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {
    uploadQueue,
    initUploadProgress,
    getUploadProgress,
    deleteUploadProgress,
    connection
} from "./redis.js";
import fs from "fs";
import path from "path";
import { authenticate } from "./middleware/auth.js";


// import "./worker.js"; // run worker in the same process to deploy on render

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

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20
});
connection.on("connect", () => {
    console.log("Redis connected");
});

app.post("/upload", authenticate, uploadLimiter, async (req, res) => {

    const busboy = Busboy({ headers: req.headers });

    const uploadId = crypto.randomUUID();
    const uploadPath = path.join("uploads", uploadId);

    let totalSize = 0;
    let originalName = "";
    let mimeType = "";

    req.on("aborted", async () => {
        await deleteUploadProgress(uploadId);
    });

    busboy.on("file", async (fieldname, file, info) => {

        originalName = info.filename;
        mimeType = info.mimeType;

        await initUploadProgress(uploadId, 0, originalName);

        const writeStream = fs.createWriteStream(uploadPath);

        file.on("data", async (data) => {
            totalSize += data.length;
        });

        file.pipe(writeStream);

        writeStream.on("finish", async () => {

            // update totalBytes in Redis
            await connection.hset(`upload:${uploadId}`, {
                totalBytes: totalSize
            });

            await uploadQueue.add("processUpload", {
                uploadId,
                filePath: uploadPath,
                fileName: originalName,
                mimeType,
                totalSize,
                userId: req.user.id
            });

        });

    });

    req.pipe(busboy);
    res.json({ uploadId });
});

app.get("/upload/status/:uploadId", (req, res) => {
    const { uploadId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // prevents proxy buffering
    res.flushHeaders();

    const interval = setInterval(async () => {
        try {
            const data = await getUploadProgress(uploadId);
            if (!data) return;

            const percent = data.totalBytes > 0
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


app.get("/files", authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        const {data, error} = await supabase
            .from("files")
            .select("*")
            .eq("user_id", userId)
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

app.get("/files/stats", authenticate, async (req, res) => {
    const bytesToGB = (bytes) =>
        bytes ? (bytes / (1024 ** 3)).toFixed(2) : "0.00";

    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("files")
            .select("total_size")
            .eq("user_id", userId);

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

app.get("/download/:fileId", authenticate, async (req, res) => {
    try {
        const { fileId } = req.params;

        // get file info and validate ownership
        const { data: fileInfo, error: err1 } = await supabase
            .from("files")
            .select("id, file_name, total_size")
            .eq("id", fileId)
            .eq("user_id", req.user.id)
            .single();

        if (err1) {
            console.error("File fetch error:", err1);
            return res.status(500).json({ error: "Failed to fetch file" });
        }

        if (!fileInfo) {
            return res.status(404).json({ error: "File not found" });
        }
        console.log(fileInfo);
        // get chunk ids
        const { data: chunks, error: err2 } = await supabase
            .from("file_chunks")
            .select("telegram_file_id")
            .eq("file_id", fileId)
            .order("chunk_index", { ascending: true });

        if (err2) {
            console.error("Chunk fetch error:", err2);
            return res.status(500).json({ error: "Failed to fetch chunks" });
        }

        if (!chunks || chunks.length === 0) {
            return res.status(404).json({ error: "No chunks found" });
        }
        const urls = [];

        for (const chunk of chunks) {
            const file = await bot.api.getFile(chunk.telegram_file_id);
            console.log(file);
            urls.push(
                `${process.env.CLOUDFLARE_URL}?path=${encodeURIComponent(file.file_path)}`
            );
        }
        console.log(urls);

        res.json({
            fileName: fileInfo.file_name,
            urls,
            totalSize: fileInfo.total_size
        });

    } catch (err) {
        console.error("Download endpoint error:", err);
        res.status(500).json({ error: "Download failed" });
    }
});

app.get("/search", authenticate, async (req, res) => {
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
                .eq("user_id", req.user.id)
                .textSearch("search_vector", query, {
                    type: "websearch",
                    config: "english"
                }));
        } else {
            // Prefix fallback
            ({ data, error } = await supabase
                .from("files")
                .select("*")
                .eq("user_id", req.user.id)
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