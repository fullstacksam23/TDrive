import fs from "fs";
import { Worker } from "bullmq";
import { connection, incrementUploadProgress, finishUpload } from "./redis.js";
import sendFile from "./bot.js";
import supabase from "./database/supabase.js";

const CHUNK_SIZE = 17 * 1024 * 1024;
const MAX_PARALLEL = 2; // REDUCE CONCURRENT PROCESSING FOR RENDER

const worker = new Worker("uploadQueue", async job => {

    if (job.name !== "processUpload") return;

    const { uploadId, filePath, fileName, mimeType, totalSize, userId } = job.data;

    const stream = fs.createReadStream(filePath, {
        highWaterMark: CHUNK_SIZE
    });

    let partNumber = 0;
    const queue = [];

    // create file row
    const { data: fileRow } = await supabase
        .from("files")
        .insert({
            user_id: userId,
            file_name: fileName,
            mimetype: mimeType,
            total_size: totalSize
        })
        .select()
        .single();

    for await (const chunk of stream) {

        partNumber++;
        const currentPart = partNumber;

        const uploadTask = async () => {

            const telegramFileId = await sendFile(
                chunk,
                `${fileName}.part${currentPart}`
            );

            await supabase.from("file_chunks").insert({
                file_id: fileRow.id,
                chunk_index: currentPart,
                telegram_file_id: telegramFileId
            });

            await incrementUploadProgress(uploadId, chunk.length);
        };

        queue.push(uploadTask());

        // run batch when limit reached
        if (queue.length >= MAX_PARALLEL) {
            await Promise.allSettled(queue);
            queue.length = 0;
        }
    }

    // wait remaining uploads
    if (queue.length > 0) {
        await Promise.allSettled(queue);
    }

    await finishUpload(uploadId);

    fs.unlinkSync(filePath);

    console.log("Upload completed:", fileName);

}, { connection, concurrency: 1 }); // REDUCE CONCURRENT PROCESSING FOR RENDER

worker.on("failed", (job, err) => {
    console.error("Job failed:", job?.id);
    console.error(err);
});

worker.on("error", err => {
    console.error("Worker error:", err);
});