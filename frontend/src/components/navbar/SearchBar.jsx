import {useRef, useState} from "react";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
import {Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button";
import {useQuery} from "@tanstack/react-query";
import * as Com from "@/components/ui/command";
import {useDebounce} from "@/hooks/DebounceHook";
import {LuLoader2, LuSearch} from "react-icons/lu";
import {useSheet} from "@/providers/SheetProvider";
import {navSearchOptions} from "@/api/queryOptions";
import {Separator} from "@/components/ui/separator";
import {capitalize, formatDateTime} from "@/utils/functions";
import {useOnClickOutside} from "@/hooks/ClickedOutsideHook";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const SearchBar = () => {
    const { currentUser } = useAuth();
    const commandRef = useRef(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedSearch] = useDebounce(search, 350);
    const [selectDrop, setSelectDrop] = useState("TMDB");
    const { data, isLoading, error } = useQuery(navSearchOptions(debouncedSearch, page, selectDrop));

    const handleInputChange = (ev) => {
        setPage(1);
        setIsOpen(true);
        setSearch(ev.target.value);
    };

    const resetSearch = () => {
        setPage(1);
        setSearch("");
        setIsOpen(false);
    };

    useOnClickOutside(commandRef, resetSearch);

    return (
        <div ref={commandRef}>
            <div className="relative mr-2 ml-2">
                <LuSearch size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input
                    value={search}
                    onChange={handleInputChange}
                    className="w-[310px] pl-8 pr-[110px]"
                    placeholder="Search for media/users..."
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[100px]">
                    <Select defaultValue={selectDrop} onValueChange={setSelectDrop}>
                        <SelectTrigger>
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {<SelectItem value="TMDB">Media</SelectItem>}
                                {currentUser.settings.books.active && <SelectItem value="BOOKS">Books</SelectItem>}
                                {currentUser.settings.games.active && <SelectItem value="IGDB">Games</SelectItem>}
                                <SelectItem value="users">Users</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isOpen && (debouncedSearch.length >= 2 || isLoading) &&
                <div className="z-50 absolute w-[310px] rounded-lg border shadow-md mt-1">
                    <Com.Command>
                        <Com.CommandList className="max-h-[350px] overflow-y-auto">
                            {isLoading &&
                                <div className="flex items-center justify-center p-4">
                                    <LuLoader2 className="h-6 w-6 animate-spin"/>
                                </div>
                            }
                            {error && (
                                error.status === 429 ?
                                    <Com.CommandEmpty>To many requests. Please try again later.</Com.CommandEmpty>
                                    :
                                    <Com.CommandEmpty>An error occurred. Please try again.</Com.CommandEmpty>
                            )}
                            {data && data.items.length === 0 &&
                                <Com.CommandEmpty>No results found.</Com.CommandEmpty>
                            }
                            {data && data.items.length > 0 &&
                                data.items.map(media =>
                                    <SearchComponent
                                        media={media}
                                        resetSearch={resetSearch}
                                    />
                                )}
                        </Com.CommandList>
                        {data && data.pages > 1 &&
                            <div className="flex justify-between items-center p-4">
                                <Button size="sm" variant="outline" disabled={page === 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {data.pages}
                                </span>
                                <Button size="sm" variant="outline" disabled={page === data.pages}
                                        onClick={() => setPage((p) => Math.min(data.pages, p + 1))}>
                                    Next
                                </Button>
                            </div>
                        }
                    </Com.Command>
                </div>
            }
        </div>
    );
};


const SearchComponent = ({ media, resetSearch }) => {
    const { setSheetOpen } = useSheet();
    const imageHeight = media.media_type === "User" ? 64 : 96;
    const url = media.media_type === "User" ?
        `/profile/${media.name}` : `/details/${media.media_type}/${media.api_id}?external=True`;

    const handleLinkClick = () => {
        resetSearch();
        setSheetOpen(false);
    };

    return (
        <Link to={url} onClick={handleLinkClick}>
            <Com.CommandItem key={media.api_id} className="cursor-pointer py-2">
                <div className="flex gap-4 items-center">
                    <img
                        alt={media.name}
                        height={imageHeight}
                        src={media.image_cover}
                        className="w-16 rounded-sm"
                    />
                    <div>
                        <div className="font-semibold mb-2 line-clamp-2">{media.name}</div>
                        <div className="text-neutral-300">{capitalize(media.media_type)}</div>
                        <div className="text-muted-foreground text-sm">{formatDateTime(media.date)}</div>
                    </div>
                </div>
            </Com.CommandItem>
            <Separator className="m-0"/>
        </Link>
    );
};
