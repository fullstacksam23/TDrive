import "dotenv/config";
import Database from "better-sqlite3";
import fs from "fs";
import supabase from "./supabase.js";


const db = new Database("../data/storage.db");
async function migrateDB() {
    try{
        const files = db.prepare("SELECT * FROM files").all();
        for (const file of files) {
            const { error } = await supabase
                .from('files')
                .insert({
                    file_name: file.file_name,
                    mimetype: file.mimetype,
                    total_size: file.total_size,
                    uploaded_at: file.uploaded_at
                });
            if (error) throw error;

        }
        console.log("files table migrated");
        const chunks = db.prepare("SELECT * FROM file_chunks").all();
        console.log(`Found ${chunks.length} chunks`);

        for (const chunk of chunks) {
            const { error } = await supabase.from("file_chunks").insert({
                file_id: chunk.file_id,
                chunk_index: chunk.chunk_index,
                telegram_file_id: chunk.telegram_file_id
            });

            if (error) throw error;
        }
        console.log("file_chunks table migrated");
    }catch(err){
        console.log(err);
    }finally {
        db.close();
    }
}
migrateDB();
