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

export async function downloadFile(fileId) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    window.open(`${apiUrl}/download/${fileId}?token=${token}`);
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
    if (mime.includes("presentation")) return {icon: Presentation, color: "text-orange-500 dark:text-orange-400"};
    if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return {icon: FileSpreadsheet, color: "text-emerald-500 dark:text-emerald-400"};
    if (mime.includes("json")) return {icon: FileJson, color: "text-violet-500 dark:text-violet-400"};
    if (mime.includes("text") || mime.includes("markdown")) return {icon: FileText, color: "text-blue-500 dark:text-blue-300"};
    if (mime.includes("code") || mime.includes("javascript")) return {icon: FileCode, color: "text-indigo-500 dark:text-indigo-400"};

    return { icon: File, color: "text-neutral-500 dark:text-neutral-500" }; // fallback
}