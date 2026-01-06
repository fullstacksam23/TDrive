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
const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_SECRET_KEY;

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

        const res = await fetch(`${apiUrl}/upload`, {
            headers: {
                'x-api-key': apiKey
            },
            method: "POST",
            body: formData
        });

        const { uploadId } = await res.json();

        // 2️⃣ Listen for progress via SSE
        const es = new EventSource(
            `${apiUrl}/upload/status/${uploadId}?api_key=${apiKey}`
        );

        es.onmessage = (event) => {
            const data = JSON.parse(event.data);

            onUploadProgress?.(data.progress);

            if (data.done) {
                es.close();
                onUploadSuccess?.();
                onUploadComplete?.();
            }
        };

        es.onerror = () => {
            console.error("SSE connection error");
            es.close();
            onUploadComplete?.();
        };
    };


    // open file dialog when button clicked
    const handleNewClick = () => {
        fileInputRef.current?.click()
    }
    useEffect(() => {
        async function getStats(){
            const res = await fetch(`${apiUrl}/files/stats`, {
                headers: {
                    'x-api-key': apiKey
                }
            });
            const data = await res.json();
            setTotalGB(data.totalGB);
        }
        getStats();
    }, [])

    return (
        <aside className="
      w-64 border-r h-screen flex flex-col
      bg-background
      dark:bg-neutral-900 dark:border-neutral-800
    ">
            <div className="flex items-center gap-3 p-4">
                <img
                    src="/logo.jpg"
                    alt="TDrive Logo"
                    className="w-12 h-12 rounded-full object-cover"
                />
                <h1 className="text-blue-300 font-semibold text-2xl tracking-wide">
                    TDrive
                </h1>
            </div>

            <div className="p-4">
                <Button
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={handleNewClick}
                >
                    <Plus className="h-4 w-4" />
                    New
                </Button>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            <ScrollArea className="flex-1 px-2">
                <div className="space-y-1">
                    <NavItem icon={<Home />} label="Home" active />
                    <NavItem icon={<Cloud />} label="My Drive" />
                    <NavItem icon={<Clock />} label="Recent" />
                    <NavItem icon={<Star />} label="Starred" />
                    <NavItem icon={<Trash />} label="Trash" />
                </div>

                <Separator className="my-4 dark:border-neutral-800" />

                <div className="px-3">
                    <p className="text-sm text-muted-foreground mb-2">Total Data Stored</p>

                    <p className="text-lg font-semibold text-foreground">
                        {totalGB ? `${totalGB} GB` : "-"}
                    </p>

                </div>
            </ScrollArea>
        </aside>
    )
}

function NavItem({ icon, label, active }) {
    return (
        <button className={`
      w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition
      ${active
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent hover:text-accent-foreground"}
      dark:hover:bg-neutral-800 dark:hover:text-white
    `}>
            {icon}
            <span>{label}</span>
        </button>
    )
}
