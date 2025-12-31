import {Search} from "lucide-react";
import React, {useState} from "react";
import {Input} from "@/lib/client/components/ui/input";


interface SearchComponentProps {
    onSearchEnter: ({ search }: { search: string }) => void
}


export const SearchComponent = ({ onSearchEnter }: SearchComponentProps) => {
    const [search, setSearch] = useState("");

    const handleOnKeyUp = async (ev: React.KeyboardEvent<HTMLInputElement>) => {
        const newValue = (ev.target as HTMLInputElement).value;
        if (ev.key !== "Enter" || newValue.length < 1) return;
        onSearchEnter({ search: newValue });
        setSearch("");
    };

    return (
        <div className="relative flex items-center">
            <Search className="absolute size-4 left-3 text-muted-foreground"/>
            <Input
                value={search}
                className="pl-9 w-62"
                onKeyUp={handleOnKeyUp}
                placeholder="Search Name"
                onChange={(ev) => setSearch(ev.target.value)}
            />
        </div>
    );
};
