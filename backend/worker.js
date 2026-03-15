import fs from "fs";
import { Worker } from "bullmq";
import { connection, setUploadProgress } from "./redis.js";
import { sendFile } from "./bot.js";
import supabase from "./database/supabase.js";

const CHUNK_SIZE = 17 * 1024 * 1024;

const worker = new Worker("uploadQueue", async job => {

    if (job.name === "processUpload") {

        const { uploadId, filePath, fileName, mimeType, totalSize } = job.data;

        const stream = fs.createReadStream(filePath, {
            highWaterMark: CHUNK_SIZE
        });

        let partNumber = 0;
        let uploadedBytes = 0;

        // create file row first
        const { data: fileRow } = await supabase
            .from("files")
            .insert({
                file_name: fileName,
                mimetype: mimeType,
                total_size: totalSize
            })
            .select()
            .single();

        for await (const chunk of stream) {

            partNumber++;

            uploadedBytes += chunk.length;

            const telegramFileId = await sendFile(
                chunk,
                `${fileName}.part${partNumber}`
            );

            // insert chunk immediately
            await supabase.from("file_chunks").insert({
                file_id: fileRow.id,
                chunk_index: partNumber,
                telegram_file_id: telegramFileId
            });

            await setUploadProgress(uploadId, {
                uploadedBytes: Math.min(uploadedBytes, totalSize),
                totalBytes: totalSize,
                fileName: fileName
            });

        }

        await setUploadProgress(uploadId, {
            uploadedBytes: totalSize,
            totalBytes: totalSize,
            done: true,
            fileName: fileName
        });

        fs.unlinkSync(filePath);

        console.log("Upload completed:", fileName);

    }

}, { connection, concurrency: 3 });

worker.on("failed", (job, err) => {
    console.error("Job failed:", job.id);
    console.error(err);
});

worker.on("error", err => {
    console.error("Worker error:", err);
});