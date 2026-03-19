import { Download } from "lucide-react";
import { downloadFile, getIconForMimeType } from "@/lib/utils.js";

export function FileGrid({ files, onDownload }) {
    if (!files.length) {
        return (
            <div className="mx-4 my-6 flex-1 min-h-0 sm:mx-6">
                <div className="flex h-full min-h-70 items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/70 p-8 text-center shadow-sm">
                    <div>
                        <p className="text-base font-semibold text-foreground">
                            No files yet
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Upload your first file to start building your drive.
                        </p>
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
                            className="group relative flex flex-col rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm transition-colors hover:border-border hover:bg-accent"
                        >
                            <div className="relative flex min-h-20 flex-1 items-center justify-center text-muted-foreground">
                                <iconData.icon
                                    className={`h-10 w-10 shrink-0 ${iconData.color}`}
                                />

                                <button
                                    onClick={async () => {
                                        try {
                                            // 🔥 Start download UI
                                            onDownload?.({
                                                fileName: item.file_name,
                                                progress: { percent: 0 },
                                            });

                                            // 🔥 Call download with progress callback
                                            await downloadFile(
                                                item.id,
                                                item.file_name,
                                                (progress) => {
                                                    onDownload?.({
                                                        fileName: item.file_name,
                                                        progress,
                                                    });
                                                }
                                            );

                                            // ✅ Mark complete
                                            onDownload?.({
                                                fileName: item.file_name,
                                                progress: { percent: 100 },
                                            });

                                            // ✨ Remove after delay
                                            setTimeout(() => {
                                                onDownload?.(null);
                                            }, 1500);

                                        } catch (err) {
                                            console.error(err);
                                            alert("Download failed");
                                            onDownload?.(null);
                                        }
                                    }}
                                    type="button"
                                    className="
                                        absolute top-2 right-2
                                        flex h-9 w-9 items-center justify-center
                                        rounded-full
                                        bg-background/70 backdrop-blur-md
                                        border border-border/60
                                        text-muted-foreground
                                        shadow-sm
                                        opacity-70 scale-95
                                        group-hover:opacity-100 group-hover:scale-100
                                        transition-all duration-200 ease-out
                                        hover:bg-primary hover:text-primary-foreground
                                        hover:shadow-md hover:scale-105
                                        active:scale-95 active:shadow-sm
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                                    "
                                    aria-label={`Download ${item.file_name}`}
                                    title="Download"
                                >
                                    <Download className="h-4 w-4 transition-transform group-hover:scale-110" />
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