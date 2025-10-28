import {cn} from "@/lib/utils/helpers";
import {useQuery} from "@tanstack/react-query";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Input} from "@/lib/client/components/ui/input";
import React, {useEffect, useRef, useState} from "react";
import {Button} from "@/lib/client/components/ui/button";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {ApiProviderType, MediaType} from "@/lib/utils/enums";
import {useSheet} from "@/lib/client/contexts/sheet-context";
import {Separator} from "@/lib/client/components/ui/separator";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {useOnClickOutside} from "@/lib/client/hooks/use-clicked-outside";
import {ChevronLeft, ChevronRight, LoaderCircle, Search} from "lucide-react";
import {Link, LinkProps, useRouter, useRouterState} from "@tanstack/react-router";
import {navSearchOptions} from "@/lib/client/react-query/query-options/query-options";
import {Command, CommandEmpty, CommandItem, CommandList} from "@/lib/client/components/ui/command";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


export const SearchBar = () => {
    const { currentUser } = useAuth();
    const commandRef = useRef(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 350);
    const [selectDrop, setSelectDrop] = useState(currentUser?.searchSelector || ApiProviderType.TMDB);
    const { data: searchResults, isLoading, error } = useQuery(navSearchOptions(debouncedSearch, page, selectDrop));

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
                    placeholder="Search for media/users..."
                    className="w-[310px] pl-8 pr-[110px] max-sm:text-sm"
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Select value={selectDrop} onValueChange={handleValueChange}>
                        <SelectTrigger className="w-[95px] border-hidden">
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
                                <div className="flex items-center justify-center p-3.5">
                                    <LoaderCircle className="size-6 animate-spin"/>
                                </div>
                            }
                            {error &&
                                <CommandEmpty className="px-3">{error.message}</CommandEmpty>
                            }
                            {searchResults && searchResults.data.length === 0 &&
                                <CommandEmpty>No results found.</CommandEmpty>
                            }
                            {searchResults && searchResults.data.length > 0 && searchResults.data.map((item) =>
                                <SearchComponent
                                    item={item}
                                    key={item.id}
                                    resetSearch={resetSearch}
                                />
                            )}
                        </CommandList>
                        <div className="flex justify-end gap-2 items-center p-4">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft/>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPage(page + 1)}
                                disabled={searchResults?.hasNextPage ? !searchResults.hasNextPage : true}
                            >
                                <ChevronRight/>
                            </Button>
                        </div>
                    </Command>
                </div>
            }
        </div>
    );
};


interface SearchComponentProps {
    resetSearch: () => void;
    item: NonNullable<Awaited<ReturnType<NonNullable<ReturnType<typeof navSearchOptions>["queryFn"]>>>>["data"][0];
}


const SearchComponent = ({ item, resetSearch }: SearchComponentProps) => {
    const router = useRouter();
    const { setSheetOpen } = useSheet();
    const destination = createDestParams();
    const imageHeight = (item.itemType === ApiProviderType.USERS) ? 64 : 96;
    const routerStatus = useRouterState({ select: (state) => state.status });
    const [clickedApiId, setClickedApiId] = useState<number | string | null>(null);

    const isLoading = routerStatus === "pending";
    const isLoadingItem = isLoading && (clickedApiId === item.id);

    const handleLinkClick = () => {
        if (isLoading) return;

        setClickedApiId(item.id);
        router.subscribe("onResolved", () => {
            resetSearch();
            setSheetOpen(false);
        });
    };

    function createDestParams(): LinkProps {
        if (item.itemType === ApiProviderType.USERS) {
            return { to: "/profile/$username", params: { username: item.name } };
        }
        return {
            search: { external: true },
            to: "/details/$mediaType/$mediaId",
            params: { mediaType: item.itemType as MediaType, mediaId: item.id },
        };
    }

    return (
        <Link {...destination} onClick={handleLinkClick} disabled={isLoading}>
            <CommandItem key={item.id} className={cn("cursor-pointer py-2", isLoadingItem && "cursor-auto")}>
                <div className="flex gap-4 items-center">
                    <div className="relative">
                        <img
                            alt={item.name}
                            src={item.image}
                            height={imageHeight}
                            className={cn("w-16 rounded-sm transition-opacity duration-200", isLoadingItem && "opacity-40")}
                        />
                        {isLoadingItem &&
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoaderCircle className="size-8 animate-spin text-white"/>
                            </div>
                        }
                    </div>
                    <div className={cn("transition-opacity duration-200", isLoadingItem && "opacity-40")}>
                        <div className="font-semibold mb-2 line-clamp-2">{item.name}</div>
                        <div className="text-neutral-300">{capitalize(item.itemType)}</div>
                        <div className="text-muted-foreground text-sm">
                            {formatDateTime(item.date, { noTime: true })}
                        </div>
                    </div>
                </div>
            </CommandItem>
            <Separator className="m-0"/>
        </Link>
    );
};
