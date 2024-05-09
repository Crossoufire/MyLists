import {useState} from "react";
import {LuSearch} from "react-icons/lu";
import {Input} from "@/components/ui/input";
import {userClient} from "@/api/MyApiClient";
import {useParams} from "@tanstack/react-router";


export const SearchMediaList = ({ initSearch, updateSearch }) => {
    const currentUser = userClient.currentUser;
    const [search, setSearch] = useState(initSearch);
    const { mediaType, username } = useParams({ strict: false });
    const condition = currentUser?.username === username ? "your" : username;

    const handleOnKeyUp = (ev) => {
        const newValue = ev.target.value;

        if (ev.key !== "Enter" || newValue.length < 1) {
            return;
        }
        updateSearch(newValue);
    }

    return (
        <div className="flex flex-col bg-transparent w-64 rounded-md border border-neutral-500">
            <div className="flex items-center min-h-2 pl-2.5">
                <LuSearch className="h-5 w-5"/>
                <Input
                    defaultValue={search}
                    onKeyUp={handleOnKeyUp}
                    onChange={(ev) => setSearch(ev.target.value)}
                    placeholder={`Search in ${condition} ${mediaType}`}
                    className="border-none focus-visible:ring-0"
                />
            </div>
        </div>
    );
};
