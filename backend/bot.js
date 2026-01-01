import { Bot, InputFile } from "grammy";
import fs from 'fs';
import fetch from 'node-fetch';

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
async function download(url, path) {
    const response = await fetch(url);
    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}
async function getFile(telegramFileId){
    try{
        const file = await bot.api.getFile(telegramFileId);
        const url_file_path = file.file_path;
        const url = `https://api.telegram.org/file/bot${bot_token}/${url_file_path}`;
        await download(url, "./file.png");
        console.log("Download Complete");
    }catch(error){
        console.log("Failed: "+error);
    }
}

export {sendFile, getFile};