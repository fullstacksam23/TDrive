import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

const THEME_STORAGE_KEY = "tdrive-theme";

function getPreferredTheme() {
    if (typeof window === "undefined") return "dark";
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    } catch (e) {}
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

function applyTheme(theme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

export function Header({ setSearchQuery, view, setView }) {
    const [value, setValue] = useState("");
    const [theme, setTheme] = useState(() => getPreferredTheme());

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(value.trim());
        }, 300);
        return () => clearTimeout(timeout);
    }, [value, setSearchQuery]);

    useEffect(() => {
        applyTheme(theme);
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (e) {}
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
            <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    className="h-9 pl-9 bg-muted/30 focus-visible:bg-background"
                    placeholder="Search in TDrive..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    name="search"
                    aria-label="Search files"
                />
            </div>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>
                <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
                    <Button
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setView("list")}
                        aria-label="List view"
                        aria-pressed={view === "list"}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={view === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setView("grid")}
                        aria-label="Grid view"
                        aria-pressed={view === "grid"}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
