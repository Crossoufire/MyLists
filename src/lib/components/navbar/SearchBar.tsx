import {Link} from "@tanstack/react-router";
import {useAuth} from "@/lib/hooks/use-auth";
import {useQuery} from "@tanstack/react-query";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {LoaderCircle, Search} from "lucide-react";
import {useDebounce} from "@/lib/hooks/use-debounce";
import {useSheet} from "@/lib/contexts/sheet-context";
import {Separator} from "@/lib/components/ui/separator";
import React, {useEffect, useRef, useState} from "react";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {useOnClickOutside} from "@/lib/hooks/use-clicked-outside";
import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";
import {navSearchOptions} from "@/lib/react-query/query-options/query-options";
import {Command, CommandEmpty, CommandItem, CommandList} from "@/lib/components/ui/command";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


export const SearchBar = () => {
    const commandRef = useRef(null);
    const { currentUser } = useAuth();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedSearch] = useDebounce(search, 350);
    const [selectDrop, setSelectDrop] = useState(currentUser?.searchSelector || ApiProviderType.TMDB);
    const { data, isLoading, error }: any = useQuery(navSearchOptions(debouncedSearch, page, selectDrop));

    useEffect(() => {
        setSelectDrop(currentUser?.searchSelector || ApiProviderType.TMDB);
    }, [currentUser?.searchSelector]);

    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setPage(1);
        setIsOpen(true);
        setSearch(ev.target.value);
    };

    const handleValueChange = (value: string) => {
        setSelectDrop(value as ApiProviderType);
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
                <Search size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input
                    value={search}
                    onChange={handleInputChange}
                    className={"w-[310px] pl-8 pr-[110px]"}
                    placeholder={"Search for media/users..."}
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Select value={selectDrop} onValueChange={handleValueChange}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value={ApiProviderType.TMDB}>Media</SelectItem>
                                {currentUser?.settings?.find(s => s.mediaType === MediaType.BOOKS)?.active &&
                                    <SelectItem value={ApiProviderType.BOOKS}>Books</SelectItem>
                                }
                                {currentUser?.settings?.find(s => s.mediaType === MediaType.GAMES)?.active &&
                                    <SelectItem value={ApiProviderType.IGDB}>Games</SelectItem>
                                }
                                {currentUser?.settings?.find(s => s.mediaType === MediaType.MANGA)?.active &&
                                    <SelectItem value={ApiProviderType.MANGA}>Manga</SelectItem>
                                }
                                <SelectItem value={ApiProviderType.USERS}>Users</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isOpen && (debouncedSearch.length >= 2 || isLoading) &&
                <div className="z-50 absolute w-[310px] mr-2 ml-2 rounded-lg border shadow-md mt-1">
                    <Command>
                        <CommandList className="max-h-[350px] overflow-y-auto">
                            {isLoading &&
                                <div className="flex items-center justify-center p-4">
                                    <LoaderCircle className="h-6 w-6 animate-spin"/>
                                </div>
                            }
                            {error && (
                                error.status === 429 ?
                                    <CommandEmpty>Too many requests. Please wait a bit and try again.</CommandEmpty>
                                    :
                                    <CommandEmpty>An error occurred. Please try again.</CommandEmpty>
                            )}
                            {data && data.length === 0 &&
                                <CommandEmpty>No results found.</CommandEmpty>
                            }
                            {data && data.length > 0 &&
                                data.map((item: any) =>
                                    <SearchComponent
                                        item={item}
                                        resetSearch={resetSearch}
                                    />
                                )}
                        </CommandList>
                        {data && data?.pages > 1 &&
                            <div className="flex justify-between items-center p-4">
                                <Button size="sm" variant="outline" disabled={page === 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {data.pages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={page === data.pages}
                                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        }
                    </Command>
                </div>
            }
        </div>
    );
};


interface SearchComponentProps {
    item: any;
    resetSearch: () => void;
}


const SearchComponent = ({ item, resetSearch }: SearchComponentProps) => {
    const { setSheetOpen } = useSheet();
    const imageHeight = item.itemType === ApiProviderType.USERS ? 64 : 96;
    const url = item.itemType === ApiProviderType.USERS ? `/profile/${item.name}` : `/details/${item.itemType}/${item.id}?external=True`;

    const handleLinkClick = () => {
        resetSearch();
        setSheetOpen(false);
    };

    return (
        <Link to={url} onClick={handleLinkClick}>
            <CommandItem key={item.apiId} className="cursor-pointer py-2">
                <div className="flex gap-4 items-center">
                    <img
                        alt={item.name}
                        src={item.image}
                        height={imageHeight}
                        className={"w-16 rounded-sm"}
                    />
                    <div>
                        <div className="font-semibold mb-2 line-clamp-2">{item.name}</div>
                        <div className="text-neutral-300">{capitalize(item.itemType)}</div>
                        <div className="text-muted-foreground text-sm">
                            {formatDateTime(item.date, { useLocalTz: true })}
                        </div>
                    </div>
                </div>
            </CommandItem>
            <Separator className="m-0"/>
        </Link>
    );
};
