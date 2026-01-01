import { Bot, InputFile } from "grammy";

import axios from "axios";

import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN
const CHAT_ID = process.env.CHAT_ID

const bot = new Bot(BOT_TOKEN);

async function sendFile(chunk, fileName){
    try{
        const response = await bot.api.sendDocument(CHAT_ID, new InputFile(chunk, fileName));
        return response.document.file_id;
    }catch (error){
        console.log("Failed uploading to telegram: "+error);
    }
}


async function getChunkBuffer(telegramFileId) {
    const file = await bot.api.getFile(telegramFileId);
    const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
}

export {sendFile, getChunkBuffer};