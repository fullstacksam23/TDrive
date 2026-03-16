import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import {
    Cloud,
    ShieldCheck,
    Zap,
    Search,
    Layers
} from "lucide-react";

export function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const displayName = useMemo(() => {
        if (user?.email) return user.email.split("@")[0];
        return "Guest";
    }, [user]);

    const handlePrimaryCta = () => navigate("/dashboard");

    const handleLearnMore = () => {
        const el = document.getElementById("features");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">

            {/* NAVBAR */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" className="h-8 w-8 rounded-full" />
                        <span className="font-bold text-lg">TDrive</span>
                    </div>

                    <div className="flex items-center gap-4">

                        {!user ? (
                            <>
                                <Button variant="ghost" onClick={() => navigate("/login")}>
                                    Login
                                </Button>

                                <Button
                                    onClick={() => navigate("/signup")}
                                    className="bg-gradient-to-r from-[#229ED9] to-[#60A5FA] text-white"
                                >
                                    Sign Up
                                </Button>
                            </>
                        ) : (
                            <>
                            <Button
                                onClick={() => navigate("/dashboard")}
                                className="bg-gradient-to-r from-[#229ED9] to-[#60A5FA] text-white"
                            >
                                Go to My Drive
                            </Button>
                                {/* Avatar Dropdown */}
                                <AvatarDropdown user={user} />
                            </>
                        )}



                    </div>
                </div>
            </header>

            <main className="flex-1">

                {/* HERO */}
                <section className="relative py-28 overflow-hidden">

                    {/* glowing background */}
                    <div className="absolute inset-0 flex justify-center -z-10">
                        <div className="h-[400px] w-[700px] rounded-full bg-gradient-to-r from-[#229ED9]/30 to-[#60A5FA]/30 blur-[120px]" />
                    </div>

                    <div className="max-w-5xl mx-auto px-4 text-center flex flex-col items-center">

                        <h1 className="mt-2 text-5xl lg:text-6xl font-bold tracking-tight leading-[1.5]">
                            Unlimited Cloud Storage
                            <span className="block bg-gradient-to-r from-[#229ED9] to-[#60A5FA] bg-clip-text text-transparent">
                Built on Telegram
              </span>
                        </h1>

                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                            TDrive transforms Telegram into your personal cloud storage.
                            Upload massive files, stream instantly, and manage everything
                            from a clean modern interface.
                        </p>

                        <div className="flex gap-4 mt-6">

                            <Button
                                size="lg"
                                onClick={handlePrimaryCta}
                                className="bg-gradient-to-r from-[#229ED9] to-[#60A5FA] text-white px-8 py-6"
                            >
                                Start storing files
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleLearnMore}
                                className="px-8 py-6"
                            >
                                Learn more
                            </Button>

                        </div>

                    </div>

                </section>

                {/* FEATURES */}
                <section
                    id="features"
                    className="py-28 border-t border-border"
                >

                    <div className="max-w-7xl mx-auto px-8">

                        <div className="text-center mb-16">

                            <h2 className="text-4xl font-bold tracking-tight">
                                Built for heavy-duty cloud storage
                            </h2>

                            <p className="mt-3 text-lg text-muted-foreground">
                                Telegram infrastructure combined with a modern cloud interface.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                            {[
                                {
                                    icon: ShieldCheck,
                                    title: "Secure Storage",
                                    desc: "Files stored redundantly on Telegram servers."
                                },
                                {
                                    icon: Layers,
                                    title: "Large File Uploads",
                                    desc: "Upload multi-GB files with efficient chunking."
                                },
                                {
                                    icon: Zap,
                                    title: "Streaming Downloads",
                                    desc: "Start streaming media instantly."
                                },
                                {
                                    icon: Search,
                                    title: "Fast Search",
                                    desc: "Find files instantly across your drive."
                                }
                            ].map((feature) => (
                                <div
                                    key={feature.title}
                                    className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition"
                                >

                                    <feature.icon className="h-6 w-6 text-[#229ED9] mb-4" />

                                    <h3 className="font-semibold text-lg mb-2">
                                        {feature.title}
                                    </h3>

                                    <p className="text-sm text-muted-foreground">
                                        {feature.desc}
                                    </p>

                                </div>
                            ))}

                        </div>

                    </div>

                </section>

            </main>

            {/* FOOTER */}
            <footer className="border-t border-border py-6 bg-background">

                <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">

                    <div className="flex items-center gap-2">
                        <img src="/logo.jpg" className="h-6 w-6 rounded-full" />
                        <span>TDrive</span>
                    </div>

                    <div className="flex gap-6">

                        <button
                            onClick={() => navigate("/")}
                            className="hover:text-foreground"
                        >
                            Home
                        </button>

                        <button
                            onClick={() => navigate("/login")}
                            className="hover:text-foreground"
                        >
                            Login
                        </button>

                        <button
                            onClick={() => navigate("/signup")}
                            className="hover:text-foreground"
                        >
                            Sign Up
                        </button>

                    </div>

                </div>

            </footer>

        </div>
    );
}

function AvatarDropdown({ user }) {
    const { logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const displayName = useMemo(() => {
        if (user?.email) return user.email.split("@")[0];
        return "guest";
    }, [user]);

    const avatarUrl =
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=ffffff`;

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">

            <img
                src={avatarUrl}
                onClick={() => setOpen(!open)}
                className="h-9 w-9 rounded-full border border-border cursor-pointer"
            />

            {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg">

                    <div className="px-3 py-2 text-sm font-medium">
                        {user?.email || "Guest"}
                    </div>

                    <div className="border-t"/>

                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>

                </div>
            )}

        </div>
    );
}