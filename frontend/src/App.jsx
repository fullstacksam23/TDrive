import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { FileGrid } from "@/components/file-grid";
import {useEffect, useState} from "react";
import Upload from "@/components/upload";

function App() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [upload, setUpload] = useState(null);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        async function loadFiles() {
            const url = searchQuery ? `http://localhost:8080/search/${encodeURIComponent(searchQuery)}` : "http://localhost:8080/files";
            const files = await fetch(url);
            const data = await files.json();
            setFiles(data);
        }
        loadFiles();
    }, [refreshKey, searchQuery]);

    function refreshFiles() {
        setRefreshKey(prev => prev + 1);
    }

    return (
        <div className="flex">
            <Sidebar
                onUploadStart={(fileName) =>
                    setUpload({ fileName, progress: 0 })
                }
                onUploadProgress={(progress) =>
                    setUpload(prev => prev ? { ...prev, progress } : prev)
                }
                onUploadComplete={() =>
                    setTimeout(() => setUpload(null), 1000)
                }
                onUploadSuccess={refreshFiles}
            />


            <div className="flex-1 flex flex-col">
                <Header setSearchQuery={setSearchQuery} />
                <FileGrid files={files} />
                <div className="fixed bottom-6 right-6 z-50">
                    {upload && (
                        <Upload
                            fileName={upload.fileName}
                            value={upload.progress}
                        />
                    )}

                </div>

            </div>
        </div>
    )
}

export default App
