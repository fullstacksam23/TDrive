import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { FileGrid } from "@/components/file-grid";
import { useState } from "react";
import Upload from "@/components/upload";

function App() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [upload, setUpload] = useState(null);

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
                <Header />
                <FileGrid refreshKey={refreshKey}/>
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
