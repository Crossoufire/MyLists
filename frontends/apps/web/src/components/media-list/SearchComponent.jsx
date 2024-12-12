import {useState} from "react";
import {Search} from "lucide-react";
import {Input} from "@/components/ui/input";


export const SearchComponent = ({ onSearchEnter }) => {
    const [search, setSearch] = useState("");

    const handleOnKeyUp = async (ev) => {
        const newValue = ev.target.value;
        if (ev.key !== "Enter" || newValue.length < 1) return;
        await onSearchEnter(newValue);
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
