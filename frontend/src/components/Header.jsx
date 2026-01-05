import {useEffect, useState} from "react";
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function Header({setSearchQuery}) {
    const [value, setValue] = useState("");
    //debounce logic
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(value.trim());
        }, 300);

        return () => clearTimeout(timeout);  //cleanup function run everytime the value changes before the effect is run again
    }, [value]);

    return (
        <header className="
      w-full h-16 flex items-center px-6 gap-4 sticky top-0 z-10
      border-b bg-background
      dark:bg-neutral-900 dark:border-neutral-800
    ">
            <div className="flex-1 max-w-xl relative">
                <Search
                    className="
            absolute left-2 top-2.5 h-4 w-4
            text-muted-foreground
            dark:text-neutral-400
          "
                />
                <Input
                    className="
            pl-8
            dark:bg-neutral-800
            dark:border-neutral-700
            dark:text-neutral-200
            dark:placeholder:text-neutral-500
          "
                    placeholder="Search in TDrive..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </header>
    )
}
