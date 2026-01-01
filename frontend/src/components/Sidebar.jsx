import { useRef } from "react"
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

export function Sidebar({onUploadSuccess}) {
    const fileInputRef = useRef(null)

    // handle file selection
    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                // 4. Send it via fetch
                const response = await fetch("http://localhost:8080/upload", {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    onUploadSuccess?.(); // <-- notify App to refresh grid
                    console.log("Success:", data);
                }
            } catch (error) {
                console.error("Error uploading:", error);
            }
        }
    }

    // open file dialog when button clicked
    const handleNewClick = () => {
        fileInputRef.current?.click()
    }

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
                    <p className="text-sm text-muted-foreground mb-2">Storage</p>

                    <div className="w-full bg-muted rounded-full h-2 mb-2 dark:bg-neutral-800">
                        <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: "35%" }}
                        />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        4 GB of 15 GB used
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
