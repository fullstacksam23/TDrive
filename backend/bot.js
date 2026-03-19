import { Bot, InputFile } from "grammy";
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN
const CHAT_ID = process.env.CHAT_ID
export const bot = new Bot(BOT_TOKEN);

// sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// upload with retry support
export default async function sendFile(chunk, fileName, retries = 5) {

    for (let attempt = 1; attempt <= retries; attempt++) {

        try {

            const response = await bot.api.sendDocument(
                CHAT_ID,
                new InputFile(chunk, fileName)
            );

            return response.document.file_id;

        } catch (error) {

            const retryAfter =
                error?.parameters?.retry_after ||
                error?.response?.parameters?.retry_after ||
                30;

            // Telegram rate limit
            if (retryAfter) {

                console.log(
                    `Telegram rate limit. Waiting ${retryAfter}s before retry...`
                );

                await sleep(retryAfter * 1000);
                continue;
            }

            // network error retry
            if (attempt < retries) {

                console.log(
                    `Upload attempt ${attempt} failed. Retrying in 2s...`
                );

                await sleep(2000);
                continue;
            }

            console.error("Failed uploading to telegram:", error);
            throw error;
        }
    }
}