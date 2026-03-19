import { Queue } from "bullmq";
import IORedis from "ioredis";
import Redis from "ioredis";

console.log(process.env.REDIS_URL);
export const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
// export const connection = new IORedis({
//     host: "redis", //rename to a localhost port for local testing without docker
//     port: 6379,
//     maxRetriesPerRequest: null,
//     enableReadyCheck: false
// });
// Queue for uploads
export const uploadQueue = new Queue("uploadQueue", {
    connection
});

// initialize upload
export async function initUploadProgress(uploadId, totalBytes, fileName) {

    await connection.hset(`upload:${uploadId}`, {
        uploadedBytes: 0,
        totalBytes,
        fileName,
        done: 0
    });

    await connection.expire(`upload:${uploadId}`, 600);
}

// atomic increment
export async function incrementUploadProgress(uploadId, chunkSize) {

    const uploadedBytes = await connection.hincrby(
        `upload:${uploadId}`,
        "uploadedBytes",
        chunkSize
    );
    await connection.expire(`upload:${uploadId}`, 600);//update TTL for long uploads
    return uploadedBytes;
}

// mark upload complete
export async function finishUpload(uploadId) {

    await connection.hset(`upload:${uploadId}`, "done", 1);
}

// get progress
export async function getUploadProgress(uploadId) {

    const data = await connection.hgetall(`upload:${uploadId}`);

    if (!data || Object.keys(data).length === 0) return null;

    return {
        uploadedBytes: Number(data.uploadedBytes),
        totalBytes: Number(data.totalBytes),
        fileName: data.fileName,
        done: data.done === "1"
    };
}

export async function deleteUploadProgress(uploadId) {
    await connection.del(`upload:${uploadId}`);
}