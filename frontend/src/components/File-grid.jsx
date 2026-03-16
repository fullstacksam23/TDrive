import {Download} from "lucide-react";
import {downloadFile, getIconForMimeType} from "@/lib/utils.js";

export function FileGrid({ files }) {
    if (!files.length) {
        return (
            <div className="mx-4 my-6 flex-1 min-h-0 sm:mx-6">
                <div className="flex h-full min-h-70 items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/70 p-8 text-center shadow-sm">
                    <div>
                        <p className="text-base font-semibold text-foreground">No files yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">Upload your first file to start building your drive.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-4 my-6 flex-1 min-h-0 sm:mx-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {files.map((item) => {
                    const iconData = getIconForMimeType(item.mimetype);
                    return (
                        <div
                            key={item.id}
                            onClick={() => downloadFile(item.id, item.file_name)}
                            className="group relative flex cursor-pointer flex-col rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm transition-colors hover:border-border hover:bg-accent"
                        >
                            <div className="relative flex min-h-20 flex-1 items-center justify-center text-muted-foreground">
                                <iconData.icon className={`h-10 w-10 shrink-0 ${iconData.color}`} />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile(item.id, item.file_name)
                                            .catch(() => alert("Download failed"));
                                    }}
                                    type="button"
                                    className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out hover:scale-105 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label={`Download ${item.file_name}`}
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                            <span className="mt-2 truncate text-center text-sm font-medium text-foreground group-hover:text-accent-foreground">
                                {item.file_name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
