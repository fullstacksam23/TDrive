import {useEffect, useState} from "react";
import {
    File,
    Folder,
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

function getIconForMimeType(mime) {
    if (!mime) return File;

    if (mime.startsWith("video/")) return {icon: FileVideo, color: "dark:text-red-400"};
    if (mime.startsWith("audio/")) return {icon: FileAudio, color: "dark:text-blue-400"};
    if (mime.startsWith("image/")) return {icon: FileImage, color: "dark:text-pink-400"};
    if (mime === "application/zip" || mime.includes("compressed")) return {icon: FileArchive, color: "dark:text-amber-400"};
    if (mime === "application/pdf") return {icon: FileText, color: "dark:text-neutral-300"};
    if (mime.includes("presentation")) return {icon: Presentation, color: "dark:text-orange-400"};
    if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return {icon: FileSpreadsheet, color: "dark:text-emerald-400"};
    if (mime.includes("json")) return {icon: FileJson, color: "dark:text-violet-400"};
    if (mime.includes("text") || mime.includes("markdown")) return {icon: FileText, color: "dark:text-blue-300"};
    if (mime.includes("code") || mime.includes("javascript")) return {icon: FileCode, color: "dark:text-indigo-400"};

    return { icon: File, color: "dark:text-neutral-500" }; // fallback
}


export function FileGrid({refreshKey}) {
    const [files, setFiles] = useState([]);
    useEffect(() => {
        async function loadFiles() {
            const files = await fetch("http://localhost:8080/files");
            const data = await files.json();
            setFiles(data);
        }
        loadFiles();
    }, [refreshKey]);


    return (
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((item) => {
                const iconData = getIconForMimeType(item.mimetype);

                return (
                    <a href={`http://localhost:8080/download/${item.id}`} key={item.id} download={item.file_name}>
                    <div
                        className="
              border rounded-lg p-4 cursor-pointer flex flex-col transition
              bg-background hover:bg-accent dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800
            "
                    >
                        <div className="flex-1 flex items-center justify-center text-muted-foreground dark:text-neutral-500">
                            <iconData.icon size={32} className={iconData.color} />
                        </div>

                        <span className="text-sm mt-2 truncate text-foreground dark:text-neutral-200 text-center">
              {item.file_name}
            </span>
                    </div>
                    </a>
                );
            })}
        </div>
    );
}
