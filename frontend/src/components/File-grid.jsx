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
    Download,

} from "lucide-react";
const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_SECRET_KEY;

function getIconForMimeType(mime) {
    if (!mime) return File;

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


export function FileGrid({ files }) {
    return (
        <div className="mx-4 my-6 flex-1 min-h-0 sm:mx-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {files.map((item) => {
                    const iconData = getIconForMimeType(item.mimetype);
                    return (
                        <a
                            key={item.id}
                            href={`${apiUrl}/download/${item.id}?api_key=${apiKey}`}
                            download={item.file_name}
                            className="group relative flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <div className="relative flex min-h-[80px] flex-1 items-center justify-center text-muted-foreground">
                                <iconData.icon className={`h-10 w-10 shrink-0 ${iconData.color}`} />
                                <div className="pointer-events-none absolute inset-0 flex items-end justify-end pr-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm">
                                        <Download className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                </div>
                            </div>
                            <span className="mt-2 truncate text-center text-sm font-medium text-foreground group-hover:text-accent-foreground">
                                {item.file_name}
                            </span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
