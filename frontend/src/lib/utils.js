import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { supabase } from "@/lib/supabase";
import {
    File,
    FileVideo,
    FileAudio,
    FileImage,
    FileArchive,
    FileText,
    FileCode,
    FileSpreadsheet,
    Presentation,
    FileJson,

} from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL;

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function downloadFile(fileId, fileName, onProgress) {
    let writable;

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: fileName
        });
        writable = await handle.createWritable();

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`${apiUrl}/download/${fileId}?token=${token}`);
        if (!res.ok) throw new Error("Failed to fetch chunk list");

        const { urls, totalSize } = await res.json();
        console.log(urls, totalSize);

        let downloaded = 0;
        let lastPercent = 0;
        let startTime = Date.now();

        for (let i = 0; i < urls.length; i++) {
            const response = await fetch(urls[i]);

            if (!response.ok || !response.body) {
                throw new Error(`Chunk ${i} failed`);
            }

            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                await writable.write(value);

                downloaded += value.length;

                if (onProgress && totalSize > 0) {
                    const percent = Math.floor((downloaded / totalSize) * 100);

                    if (percent !== lastPercent) {
                        lastPercent = percent;

                        const elapsed = (Date.now() - startTime) / 1000;
                        const speed = downloaded / elapsed;

                        onProgress({ percent, speed });
                    }
                }
            }
        }

        await writable.close();
        if (onProgress) onProgress({ percent: 100, speed: 0 });

        console.log("Download complete!");

    } catch (err) {
        if (err.name === "AbortError") return;

        if (writable) {
            try { await writable.abort(); } catch {}
        }

        console.error("Download failed:", err);
    }
}

export function getIconForMimeType(mime) {
    if (!mime) {
        return { icon: File, color: "text-neutral-500 dark:text-neutral-500" };
    }

    if (mime.startsWith("video/")) return {icon: FileVideo, color: "text-red-500 dark:text-red-400"};
    if (mime.startsWith("audio/")) return {icon: FileAudio, color: "text-blue-500 dark:text-blue-400"};
    if (mime.startsWith("image/")) return {icon: FileImage, color: "text-purple-500 dark:text-purple-400"};
    if (mime === "application/zip" || mime.includes("compressed")) return {icon: FileArchive, color: "text-amber-500 dark:text-amber-400"};
    if (mime === "application/pdf") return {icon: FileText, color: "text-neutral-500 dark:text-neutral-300"};
    if (mime.includes("presentation") || mime.includes("powerpoint")) return {icon: Presentation, color: "text-orange-500 dark:text-orange-400"};
    if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return {icon: FileSpreadsheet, color: "text-emerald-500 dark:text-emerald-400"};
    if (mime.includes("json")) return {icon: FileJson, color: "text-violet-500 dark:text-violet-400"};
    if (mime.includes("text") || mime.includes("markdown")) return {icon: FileText, color: "text-blue-500 dark:text-blue-300"};
    if (mime.includes("code") || mime.includes("javascript")) return {icon: FileCode, color: "text-indigo-500 dark:text-indigo-400"};

    return { icon: File, color: "text-neutral-500 dark:text-neutral-500" }; // fallback
}