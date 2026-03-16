import {Download} from "lucide-react";
import {downloadFile, getIconForMimeType} from "@/lib/utils.js";

export function FileGrid({ files }) {
    return (
        <div className="mx-4 my-6 flex-1 min-h-0 sm:mx-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {files.map((item) => {
                    const iconData = getIconForMimeType(item.mimetype);
                    return (
                        <div
                            key={item.id}
                            onClick={() => downloadFile(item.id, item.file_name)}
                            className="group relative flex flex-col rounded-lg border border-border bg-card p-4 cursor-pointer transition-colors hover:bg-accent hover:border-border"
                        >
                            <div className="relative flex min-h-[80px] flex-1 items-center justify-center text-muted-foreground">
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
