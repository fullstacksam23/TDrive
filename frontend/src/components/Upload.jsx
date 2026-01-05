import { Progress } from "@/components/ui/progress";

export default function Upload({ fileName, value }) {
    return (
        <div
            className="
        fixed bottom-6 right-6 z-50
        w-72
        bg-zinc-900 text-white
        rounded-xl shadow-2xl
        p-4
        border border-zinc-800
        animate-in fade-in slide-in-from-bottom-4
      "
        >
            <p className="text-sm font-medium truncate mb-2">
                {fileName}
            </p>

            <Progress value={value} className="w-full h-2" />

            <p className="text-xs text-zinc-400 mt-1 text-right">
                {value}%
            </p>
        </div>
    );
}
