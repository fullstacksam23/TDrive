import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
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
const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_SECRET_KEY;

function getIconForMimeType(mime) {
    if (!mime) return File;

    if (mime.startsWith("video/")) return {icon: FileVideo, color: "dark:text-red-400"};
    if (mime.startsWith("audio/")) return {icon: FileAudio, color: "dark:text-blue-400"};
    if (mime.startsWith("image/")) return {icon: FileImage, color: "dark:text-purple-400"};
    if (mime === "application/zip" || mime.includes("compressed")) return {icon: FileArchive, color: "dark:text-amber-400"};
    if (mime === "application/pdf") return {icon: FileText, color: "dark:text-neutral-300"};
    if (mime.includes("presentation")) return {icon: Presentation, color: "dark:text-orange-400"};
    if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return {icon: FileSpreadsheet, color: "dark:text-emerald-400"};
    if (mime.includes("json")) return {icon: FileJson, color: "dark:text-violet-400"};
    if (mime.includes("text") || mime.includes("markdown")) return {icon: FileText, color: "dark:text-blue-300"};
    if (mime.includes("code") || mime.includes("javascript")) return {icon: FileCode, color: "dark:text-indigo-400"};

    return { icon: File, color: "dark:text-neutral-500" }; // fallback
}
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export default function FileList({ files }) {
    return (
        <div className="m-4 bg-white dark:bg-zinc-950 rounded-xl border border-transparent dark:border-zinc-800">
            <Table>
                <TableHeader className="hover:bg-transparent">
                    <TableRow className="border-b border-gray-100 dark:border-zinc-800">
                        <TableHead className="w-[400px] text-slate-700 dark:text-zinc-400 font-medium py-3">Name</TableHead>
                        <TableHead className="text-slate-700 dark:text-zinc-400 font-medium">Last modified</TableHead>
                        <TableHead className="text-right text-slate-700 dark:text-zinc-400 font-medium">File size</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => {
                        const iconData = getIconForMimeType(file.mimetype);
                        return (
                        <TableRow
                            key={file.id}
                            className="group hover:bg-slate-50 dark:hover:bg-zinc-900/50 border-none transition-colors cursor-pointer"
                        >
                            <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                    <iconData.icon className={iconData.color}/>
                                    <span className="text-sm font-normal text-slate-900 dark:text-zinc-100">
                                        {file.file_name}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500 dark:text-zinc-500">
                                {(()=>{
                                    const date = new Date(file.uploaded_at);
                                    return date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })
                                })()}
                            </TableCell>
                            <TableCell className="text-right text-sm text-slate-500 dark:text-zinc-500">
                                {formatSize(file.total_size)}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="dark:text-zinc-400 dark:hover:text-zinc-100"
                                        >
                                            <MoreVertical className="w-4 h-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="dark:bg-zinc-900 dark:border-zinc-800">
                                        <DropdownMenuItem asChild className="dark:focus:bg-zinc-800">
                                            <a
                                                href={`${apiUrl}/download/${file.id}?api_key=${apiKey}`}
                                                download={file.file_name}
                                            >
                                                Download
                                            </a>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="dark:focus:bg-zinc-800">Rename</DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 dark:text-red-400 dark:focus:bg-red-950/30">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
