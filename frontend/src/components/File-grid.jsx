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

    if (mime.startsWith("video/")) return FileVideo;
    if (mime.startsWith("audio/")) return FileAudio;
    if (mime.startsWith("image/")) return FileImage;
    if (mime === "application/zip" || mime.includes("compressed")) return FileArchive;
    if (mime === "application/pdf") return FileText;
    if (mime.includes("presentation")) return Presentation; // ppt, odp
    if (mime.includes("spreadsheet") || mime.includes("excel")) return FileSpreadsheet; // xlsx, ods
    if (mime.includes("json")) return FileJson;
    if (mime.includes("text") || mime.includes("markdown")) return FileText;
    if (mime.includes("code") || mime.includes("javascript")) return FileCode;

    return File; // fallback
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
                const Icon = getIconForMimeType(item.mimetype);

                return (
                    <div
                        key={item.id}
                        className="
              border rounded-lg p-4 cursor-pointer flex flex-col transition
              bg-background hover:bg-accent dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-800
            "
                    >
                        <div className="flex-1 flex items-center justify-center text-muted-foreground dark:text-neutral-500">
                            <Icon size={32} className="dark:text-neutral-300" />
                        </div>

                        <span className="text-sm mt-2 truncate text-foreground dark:text-neutral-200 text-center">
              {item.file_name}
            </span>
                    </div>
                );
            })}
        </div>
    );
}
