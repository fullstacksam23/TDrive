import { useEffect, useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Moon, Sun, LogOut, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const THEME_STORAGE_KEY = "tdrive-theme";

function getPreferredTheme() {
    if (typeof window === "undefined") return "dark";
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    } catch {}
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

function applyTheme(theme) {
    const root = document.documentElement;
    theme === "dark"
        ? root.classList.add("dark")
        : root.classList.remove("dark");
}

export function Header({ setSearchQuery, view, setView }) {
    const [value, setValue] = useState("");
    const [theme, setTheme] = useState(getPreferredTheme);
    const [open, setOpen] = useState(false);

    const { user, logout } = useAuth();

    const dropdownRef = useRef(null);

    const displayName = useMemo(() => {
        if (user?.email) return user.email.split("@")[0];
        return "guest";
    }, [user]);

    const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffffff`;

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(value.trim());
        }, 300);
        return () => clearTimeout(timeout);
    }, [value]);

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    // close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTheme = () =>
        setTheme(prev => (prev === "dark" ? "light" : "dark"));

    return (
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/80 bg-background/85 px-4 shadow-sm backdrop-blur sm:px-6">

            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    className="h-9 pl-9"
                    placeholder="Search in TDrive..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>

            <div className="ml-auto flex items-center gap-2">

                {/* Theme */}
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {theme === "dark"
                        ? <Sun className="h-4 w-4"/>
                        : <Moon className="h-4 w-4"/>
                    }
                </Button>

                {/* View */}
                <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
                    <Button
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setView("list")}
                    >
                        <List className="h-4 w-4"/>
                    </Button>

                    <Button
                        variant={view === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setView("grid")}
                    >
                        <LayoutGrid className="h-4 w-4"/>
                    </Button>
                </div>

                {/* Avatar Dropdown */}
                <div ref={dropdownRef} className="relative">

                    <img
                        src={avatarUrl}
                        onClick={() => setOpen(!open)}
                        className="h-9 w-9 rounded-full border cursor-pointer"
                    />

                    {open && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg">

                            <div className="px-3 py-2 text-sm font-medium">
                                {user?.email}
                            </div>

                            <div className="border-t"/>

                            <button
                                onClick={() => logout()}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                            >
                                <LogOut className="h-4 w-4"/>
                                Sign out
                            </button>

                        </div>
                    )}

                </div>

            </div>
        </header>
    );
}