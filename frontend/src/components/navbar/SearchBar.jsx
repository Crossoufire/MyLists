import {toast} from "sonner";
import {useRef, useState} from "react";
import {LuSearch} from "react-icons/lu";
import {Input} from "@/components/ui/input";
import {useApi} from "@/providers/ApiProvider";
import {useDebounce} from "@/hooks/DebouceHook";
import {useUser} from "@/providers/UserProvider";
import {ShowSearch} from "@/components/navbar/ShowSearch";
import {useOnClickOutside} from "@/hooks/ClickedOutsideHook";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const SearchBar = () => {
    const api = useApi();
    const searchRef = useRef();
    const {currentUser} = useUser();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState();
    const [activePage, setActivePage] = useState(1);
    const [selectDrop, setSelectDrop] = useState(currentUser ? "TMDB" : "users");

    const changeSelect = (value) => setSelectDrop(value);

    const handleSearchChange = (ev) => {
        if (query.length >= 2) {
            resetSearch();
        }

        setQuery(ev.target.value);
    };

    const resetSearch = () => {
        setQuery("");
        setResults(undefined);
    };

    const searchMedia = async (page = 1) => {
        if (!query || query.trim() === "" || query.length < 2) {
            return;
        }

        const response = await api.get("/autocomplete", {
            q: query,
            page: page,
            selector: selectDrop,
        });

        if (!response.ok) {
            resetSearch();
            return toast.error(response.body.description);
        }

        setResults(response.body.data);
        setActivePage(page);
    };

    useOnClickOutside(searchRef, () => resetSearch());
    useDebounce(query, 300, searchMedia);

    return (
        <div ref={searchRef} className="flex flex-col relative bg-transparent w-80 rounded-md border border-neutral-500 mx-2">
            <div className="flex items-center min-h-2 pl-2.5">
                <LuSearch size={26}/>
                <Input
                    value={query}
                    onChange={handleSearchChange}
                    placeholder="Search media/users"
                    className="border-none focus-visible:ring-0"
                />
                <Select defaultValue={selectDrop} onValueChange={changeSelect}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {currentUser && <SelectItem value="TMDB">Media</SelectItem>}
                            {currentUser?.add_books && <SelectItem value="BOOKS">Books</SelectItem>}
                            {currentUser?.add_books && <SelectItem value="IGDB">Games</SelectItem>}
                            <SelectItem value="users">Users</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <ShowSearch
                query={query}
                results={results}
                activePage={activePage}
                resetSearch={resetSearch}
                searchMedia={searchMedia}
            />
        </div>
    );
};

