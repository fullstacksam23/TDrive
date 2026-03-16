import {useEffect, useRef, useState} from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Home,
    Cloud,
    Clock,
    Star,
    Trash,
    Plus
} from "lucide-react"
import api from "../lib/api.js"
import { supabase } from "@/lib/supabase";

export function Sidebar({
                            onUploadStart,
                            onUploadProgress,
                            onUploadSuccess,
                            onUploadComplete
                        }) {
    const fileInputRef = useRef(null)
    const [totalGB, setTotalGB] = useState(null);
    // handle file selection
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        onUploadStart?.(file.name);

        const formData = new FormData();
        formData.append("file", file);
        let uploadId;
        try {
            const res = await api.post('/upload', formData)
            uploadId = res.data.uploadId;
        }catch(err) {
            console.error('Upload Failed: ', err);
            onUploadComplete?.();
            return;
        }
        // Listen for progress via SSE. Pass access token via query param.
        const {
            data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        const url = new URL(`${import.meta.env.VITE_API_URL}/upload/status/${uploadId}`);
        if (token) {
            url.searchParams.set("access_token", token);
        }
        const es = new EventSource(url.toString());

        es.onmessage = (event) => {
            const data = JSON.parse(event.data);

            onUploadProgress?.(data.progress);

            if (data.done) {
                es.close();
                onUploadSuccess?.();
                onUploadComplete?.();
                e.target.value = "";
            }
        };

        es.onerror = () => {
            console.error("SSE connection error");
            es.close();
            onUploadComplete?.();
            e.target.value = "";
        };
    };


    // open file dialog when button clicked
    const handleNewClick = () => {
        fileInputRef.current?.click()
    }
    useEffect(() => {
        async function getStats() {
            const res = await api.get("/files/stats");
            setTotalGB(res.data.totalGB);
        }
        getStats();
    }, [])

    return (
        <aside className="w-64 shrink-0 border-r border-border/80 bg-background/90 text-foreground shadow-sm backdrop-blur supports-backdrop-filter:bg-background/75 h-full min-h-0 flex flex-col">
            <div className="flex items-center gap-3 px-4 py-4">
                <img
                    src="/logo.jpg"
                    alt="TDrive Logo"
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-border"
                />
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    TDrive
                </h1>
            </div>

            <div className="px-4 pb-2">
                <Button
                    variant="outline"
                    className="h-9 w-full justify-center gap-2 border-border/80 bg-muted/50 hover:bg-muted"
                    onClick={handleNewClick}
                >
                    <Plus className="h-4 w-4" />
                    New
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    aria-hidden
                />
            </div>

            <ScrollArea className="flex-1 min-h-0 px-3">
                <nav className="space-y-0.5 py-2" aria-label="Main navigation">
                    <NavItem icon={<Home className="h-4 w-4 shrink-0" />} label="Home" active />
                    <NavItem icon={<Cloud className="h-4 w-4 shrink-0" />} label="My Drive" />
                    <NavItem icon={<Clock className="h-4 w-4 shrink-0" />} label="Recent" />
                    <NavItem icon={<Star className="h-4 w-4 shrink-0" />} label="Starred" />
                    <NavItem icon={<Trash className="h-4 w-4 shrink-0" />} label="Trash" />
                </nav>

                <Separator className="my-3 border-border" />

                <div className="px-2 py-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Storage
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                        {totalGB != null ? `${totalGB} GB` : "—"}
                    </p>
                </div>
            </ScrollArea>
        </aside>
    )
}

function NavItem({ icon, label, active }) {
    return (
        <button
            type="button"
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                    ? "bg-accent/85 text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
