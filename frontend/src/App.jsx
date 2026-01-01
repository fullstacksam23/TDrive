import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { FileGrid } from "@/components/file-grid"
import { useState } from "react";

function App() {
    const [refreshKey, setRefreshKey] = useState(0);
    function refreshFiles() {
        setRefreshKey(prev => prev + 1);
    }

    return (
        <div className="flex">
            <Sidebar onUploadSuccess={refreshFiles}/>

            <div className="flex-1 flex flex-col">
                <Header />
                <FileGrid refreshKey={refreshKey}/>
            </div>
        </div>
    )
}

export default App
