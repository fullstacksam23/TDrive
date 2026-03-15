import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis({
    host: "redis",
    port: 6379,
    maxRetriesPerRequest: null // required for BullMQ stability
});

// Queue for uploads
export const uploadQueue = new Queue("uploadQueue", {
    connection
});

// Save upload progress
export async function setUploadProgress(uploadId, data) {

    const existing = await connection.get(`upload:${uploadId}`);
    const prev = existing ? JSON.parse(existing) : {};

    const merged = { ...prev, ...data };

    await connection.set(
        `upload:${uploadId}`,
        JSON.stringify(merged),
        "EX",
        600
    );
}

export async function getUploadProgress(uploadId) {
    const data = await connection.get(`upload:${uploadId}`);
    return data ? JSON.parse(data) : null;
}

export async function deleteUploadProgress(uploadId) {
    await connection.del(`upload:${uploadId}`);
}