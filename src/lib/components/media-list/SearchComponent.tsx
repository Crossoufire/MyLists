import {Search} from "lucide-react";
import React, {useState} from "react";
import {Input} from "@/lib/components/ui/input";


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
            <Search className="absolute h-4 w-4 left-3"/>
            <Input
                value={search}
                className="pl-9"
                onKeyUp={handleOnKeyUp}
                placeholder="Search Name"
                onChange={(ev) => setSearch(ev.target.value)}
            />
        </div>
    );
};
