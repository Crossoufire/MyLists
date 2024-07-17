import {toast} from "sonner";
import {capitalize} from "@/lib/utils";
import {useRef, useState} from "react";
import {LuSearch} from "react-icons/lu";
import {Link} from "@tanstack/react-router";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useLoading} from "@/hooks/LoadingHook";
import {useDebounce} from "@/hooks/DebounceHook";
import {api, userClient} from "@/api/MyApiClient";
import {useSheet} from "@/providers/SheetProvider";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/app/base/Loading";
import {useOnClickOutside} from "@/hooks/ClickedOutsideHook";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const SearchBar = ({ currentUser }) => {
    const searchRef = useRef();
    const [results, setResults] = useState();
    const [query, setQuery] = useState("");
    const [activePage, setActivePage] = useState(1);
    const [selectDrop, setSelectDrop] = useState("TMDB");

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
                            {<SelectItem value="TMDB">Media</SelectItem>}
                            {currentUser.add_books && <SelectItem value="BOOKS">Books</SelectItem>}
                            {currentUser.add_games && <SelectItem value="IGDB">Games</SelectItem>}
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


const ShowSearch = ({ query, activePage, results, resetSearch, searchMedia }) => {
    const [isLoading, handleLoading] = useLoading(0);

    if (query.length > 1 && results === undefined) {
        return (
            <div className="z-20 absolute h-[52px] w-80 top-11 bg-background border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    <Loading/>
                </div>
            </div>
        );
    }

    if (results === undefined) {
        return;
    }

    if (results.items.length === 0) {
        return (
            <div className="z-20 absolute h-[40px] w-80 top-11 bg-background border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    Sorry, no matches found
                </div>
            </div>
        );
    }

    const handleClickNext = async () => {
        await handleLoading(searchMedia, activePage + 1);
    };

    const handleClickPrev = async () => {
        await handleLoading(searchMedia, activePage - 1);
    };

    return (
        <div className="z-20 absolute max-h-[600px] w-80 top-11 bg-background border rounded-md font-medium overflow-y-auto">
            <div className="flex justify-between items-center mt-3 px-3">
                <div>
                    <Button variant="secondary" size="sm" className="mr-2" onClick={handleClickPrev} disabled={activePage === 1}>
                        Previous
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleClickNext} disabled={results.pages === 1}>
                        Next
                    </Button>
                </div>
                <div>Page: {activePage} / {results.pages}</div>
            </div>
            <Separator className="mt-3"/>
            {isLoading ?
                <div className="ml-2 mt-2 mb-3">
                    <Loading/>
                </div>
                :
                results.items.map(media =>
                    <MediaSearch
                        date={media.date}
                        name={media.name}
                        key={media.api_id}
                        apiId={media.api_id}
                        resetSearch={resetSearch}
                        mediaType={media.media_type}
                        thumbnail={media.image_cover}
                    />
                )
            }
        </div>
    );
};


const MediaSearch = ({ apiId, name, mediaType, thumbnail, date, resetSearch }) => {
    const { setSheetOpen } = useSheet();
    const imageHeight = mediaType === "User" ? 64 : 96;
    const url = mediaType === "User" ? `/profile/${name}` : `/details/${mediaType}/${apiId}?external=True`;

    const handleLinkClick = () => {
        resetSearch();
        setSheetOpen(false);
    };

    return (
        <Link to={url} onClick={handleLinkClick}>
            <div className="flex border-b gap-x-4 p-3 items-center w-full min-h-6 hover:bg-neutral-900">
                <img
                    src={thumbnail}
                    height={imageHeight}
                    className="w-16 rounded-sm"
                    alt={name}
                />
                <div>
                    <div className="font-semibold mb-2">{name}</div>
                    <div className="text-neutral-300">{capitalize(mediaType)}</div>
                    <div className="text-muted-foreground text-sm">{date}</div>
                </div>
            </div>
        </Link>
    );
};