import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { FileGrid } from "@/components/File-grid";
import { useEffect, useState } from "react";
import Upload from "@/components/Upload";
import FileList from "@/components/File-list";
import { supabase } from "@/lib/supabase";

const VIEW_STORAGE_KEY = "tdrive-view";

function getStoredView() {
    try {
        const stored = localStorage.getItem(VIEW_STORAGE_KEY);
        if (stored === "list" || stored === "grid") return stored;
    } catch (_) {}
    return "list";
}

function App() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [upload, setUpload] = useState(null);
    const [download, setDownload] = useState(null); // ✅ NEW
    const [files, setFiles] = useState([]);

    const [view, setView] = useState(getStoredView);

    useEffect(() => {
        try {
            localStorage.setItem(VIEW_STORAGE_KEY, view);
        } catch (_) {}
    }, [view]);

    useEffect(() => {
        async function loadFiles() {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            const apiUrl = import.meta.env.VITE_API_URL;

            const url = searchQuery
                ? `${apiUrl}/search/?q=${encodeURIComponent(searchQuery)}`
                : `${apiUrl}/files`;

            const filesRes = await fetch(url, {
                headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {},
            });

            const json = await filesRes.json();
            setFiles(json);
        }

        loadFiles();
    }, [refreshKey, searchQuery]);

    function refreshFiles() {
        setRefreshKey((prev) => prev + 1);
    }

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            {/* Sidebar */}
            <Sidebar
                onUploadStart={(fileName) =>
                    setUpload({ fileName, progress: 0 })
                }
                onUploadProgress={(progress) =>
                    setUpload((prev) =>
                        prev ? { ...prev, progress } : prev
                    )
                }
                onUploadComplete={() =>
                    setTimeout(() => setUpload(null), 1000)
                }
                onUploadSuccess={refreshFiles}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-auto">
                <Header
                    setSearchQuery={setSearchQuery}
                    view={view}
                    setView={setView}
                />

                {view === "list" ? (
                    <FileList files={files} onDownload={setDownload} />
                ) : (
                    <FileGrid files={files} onDownload={setDownload} />
                )}
            </div>

            {/* Upload + Download UI */}
            <div className="fixed bottom-6 right-6 z-50 space-y-3">
                {/* Upload */}
                {upload && (
                    <Upload
                        fileName={upload.fileName}
                        progress={{ percent: upload.progress }}
                    />
                )}

                {/* Download */}
                {download && (
                    <Upload
                        fileName={download.fileName}
                        progress={download.progress}
                    />
                )}
            </div>
        </div>
    );
}

export default App;