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
import {downloadFile, getIconForMimeType} from "@/lib/utils.js";

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function FileList({ files }) {
    return (
        <div className="mx-4 my-6 flex-1 min-h-0 sm:mx-6">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                            <TableHead className="w-[min(400px,50%)] font-medium text-muted-foreground py-3.5">
                                Name
                            </TableHead>
                            <TableHead className="font-medium text-muted-foreground py-3.5">
                                Last modified
                            </TableHead>
                            <TableHead className="text-right font-medium text-muted-foreground py-3.5">
                                Size
                            </TableHead>
                            <TableHead className="w-12 p-0" aria-hidden />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => {
                            const iconData = getIconForMimeType(file.mimetype);
                            return (
                                <TableRow
                                    key={file.id}
                                    className="group border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <iconData.icon className={`h-5 w-5 shrink-0 ${iconData.color}`} />
                                            <span className="truncate text-sm font-medium text-foreground">
                                                {file.file_name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap py-3">
                                        {formatDate(file.uploaded_at)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap py-3">
                                        {formatSize(file.total_size)}
                                    </TableCell>
                                    <TableCell className="py-2 pr-2 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                                    aria-label="Actions"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                <DropdownMenuItem
                                                    onClick={() => downloadFile(file.id, file.file_name)}
                                                >
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Rename</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive">
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
        </div>
    );
}
