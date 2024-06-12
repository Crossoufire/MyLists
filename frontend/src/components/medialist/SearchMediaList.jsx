import {useState} from "react";
import {capitalize} from "@/lib/utils";
import {LuSearch} from "react-icons/lu";
import {Input} from "@/components/ui/input";
import {useParams} from "@tanstack/react-router";


export const SearchMediaList = ({ updateSearch }) => {
    const [search, setSearch] = useState("");
    const { mediaType } = useParams({ strict: false });

    const handleOnKeyUp = async (ev) => {
        const newValue = ev.target.value;
        if (ev.key !== "Enter" || newValue.length < 1) {
            return;
        }
        await updateSearch(newValue);
        setSearch("");
    };

    return (
        <div className="flex flex-col bg-transparent w-64 rounded-md border border-gray-700">
            <div className="flex items-center min-h-2 pl-2.5">
                <LuSearch className="h-5 w-5"/>
                <Input
                    value={search}
                    onKeyUp={handleOnKeyUp}
                    className="border-none focus-visible:ring-0"
                    onChange={(ev) => setSearch(ev.target.value)}
                    placeholder={`Search ${capitalize(mediaType)} Collection`}
                />
            </div>
        </div>
    );
};
