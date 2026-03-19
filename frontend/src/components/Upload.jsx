import { Progress } from "@/components/ui/progress";
import { File, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Upload({ fileName, progress }) {
    const [done, setDone] = useState(false);

    // Support both old (number) and new ({ percent, speed }) formats
    const percent =
        typeof progress === "number"
            ? progress
            : progress?.percent ?? 0;

    const speed =
        typeof progress === "object" && progress?.speed
            ? progress.speed
            : null;

    useEffect(() => {
        if (percent >= 100) {
            setDone(true);
        } else {
            setDone(false);
        }
    }, [percent]);

    return (
        <div
            className="
            w-80
            rounded-xl
            border border-border
            bg-background/90 backdrop-blur-md
            shadow-lg
            p-4
            animate-in fade-in slide-in-from-bottom-4
        "
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                {!done ? (
                    <File className="h-5 w-5 text-muted-foreground" />
                ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />
                )}

                <p className="text-sm font-medium truncate flex-1">
                    {fileName}
                </p>

                <span className="text-xs text-muted-foreground">
                    {done
                        ? "Done"
                        : `${percent}%${
                            speed
                                ? ` • ${(speed / 1024 / 1024).toFixed(1)} MB/s`
                                : ""
                        }`}
                </span>
            </div>

            {/* Progress bar */}
            {!done && (
                <Progress
                    value={percent}
                    className="w-full h-2 transition-all"
                />
            )}
        </div>
    );
}