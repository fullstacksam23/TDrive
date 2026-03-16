import { Progress } from "@/components/ui/progress";
import { File, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Upload({ fileName, value }) {
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (value >= 100) {
            setDone(true);
        }
    }, [value]);

    return (
        <div
            className="
            fixed bottom-6 right-6 z-50
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
                    {done ? "Done" : `${value}%`}
                </span>

            </div>

            {/* Progress bar */}
            {!done && (
                <Progress
                    value={value}
                    className="w-full h-2 transition-all"
                />
            )}

        </div>
    );
}