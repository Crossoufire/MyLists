import {cn} from "@/lib/utils/helpers";
import {useQuery} from "@tanstack/react-query";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Input} from "@/lib/client/components/ui/input";
import React, {useEffect, useRef, useState} from "react";
import {Button} from "@/lib/client/components/ui/button";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {ApiProviderType, MediaType} from "@/lib/utils/enums";
import {Separator} from "@/lib/client/components/ui/separator";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {useOnClickOutside} from "@/lib/client/hooks/use-clicked-outside";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";
import {Link, LinkProps, useRouter, useRouterState} from "@tanstack/react-router";
import {ChevronLeft, ChevronRight, Loader2, Search, SearchX, X} from "lucide-react";
import {navSearchOptions} from "@/lib/client/react-query/query-options/query-options";
import {Command, CommandEmpty, CommandItem, CommandList} from "@/lib/client/components/ui/command";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


interface SearchBarProps {
    setMobileMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}


export const SearchBar = ({ setMobileMenu }: SearchBarProps) => {
    const { currentUser } = useAuth();
    const commandRef = useRef(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 350);
    const [selectOpen, setSelectOpen] = useState(false);
    const [selectDrop, setSelectDrop] = useState(currentUser?.searchSelector || ApiProviderType.TMDB);
    const { data: searchResults, isFetching, error } = useQuery(navSearchOptions(debouncedSearch, page, selectDrop));

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect - When user change `searchSelector` in settings
        setSelectDrop(currentUser?.searchSelector || ApiProviderType.TMDB);
    }, [currentUser?.searchSelector]);

    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setPage(1);
        setIsOpen(true);
        setSearch(ev.target.value);
    };

    const handleValueChange = (value: string) => {
        setSearch("");
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
            <div className={cn("flex items-center bg-background border rounded-lg transition-all duration-200 overflow-hidden",
                "focus-within:ring-2 focus-within:ring-app-accent/50 focus-within:border-app-accent",
                selectOpen ? "ring-2 ring-app-accent/50 border-app-accent" : "border"
            )}>
                <Select value={selectDrop} onValueChange={handleValueChange} onOpenChange={setSelectOpen}>
                    <SelectTrigger className="h-10 rounded-none w-30 border-y-0 border-l-0 border-r border-input bg-accent/50
                    focus:ring-0 focus:ring-offset-0">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value={ApiProviderType.TMDB}>
                                Media
                            </SelectItem>
                            {currentUser?.settings?.find((s) => s.mediaType === MediaType.BOOKS)?.active &&
                                <SelectItem value={ApiProviderType.BOOKS}>
                                    Books
                                </SelectItem>
                            }
                            {currentUser?.settings?.find((s) => s.mediaType === MediaType.GAMES)?.active &&
                                <SelectItem value={ApiProviderType.IGDB}>
                                    Games
                                </SelectItem>
                            }
                            {currentUser?.settings?.find((s) => s.mediaType === MediaType.MANGA)?.active &&
                                <SelectItem value={ApiProviderType.MANGA}>
                                    Manga
                                </SelectItem>
                            }
                            <SelectItem value={ApiProviderType.USERS}>
                                Users
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Input
                    value={search}
                    onChange={handleInputChange}
                    placeholder="Search for media/users..."
                    className="flex-1 text-sm border-none focus:outline-none focus:ring-0
                    focus:border-none focus-visible:border-none focus-visible:ring-0"
                />
                <div className="px-3 text-muted-foreground">
                    {(isFetching && search.trim().length >= 2) ?
                        <Loader2 className="size-4 animate-spin text-app-accent"/>
                        :
                        isOpen ?
                            <X className="size-4 cursor-pointer" onClick={resetSearch}/>
                            :
                            <Search className="size-4"/>
                    }
                </div>
            </div>
            {isOpen && (debouncedSearch.length >= 2 && !isFetching) &&
                <div className="absolute top-full mt-1 bg-background border rounded-lg shadow-2xl overflow-hidden z-60
                animate-in fade-in zoom-in-95 duration-200 w-full md:w-sm md:left-auto">
                    <Command shouldFilter={false}>
                        <CommandList className="max-h-88 overflow-y-auto scrollbar-thin">
                            {error &&
                                <CommandEmpty className="px-3">
                                    {error.message}
                                </CommandEmpty>
                            }
                            {searchResults && searchResults.data.length === 0 &&
                                <EmptyState
                                    icon={SearchX}
                                    className="py-6"
                                    message={`No results found for '${debouncedSearch}'`}
                                />
                            }
                            {searchResults && searchResults.data.length > 0 && searchResults.data.map((item) =>
                                <SearchComponent
                                    item={item}
                                    key={item.id}
                                    resetSearch={resetSearch}
                                    setMobileMenu={setMobileMenu}
                                />
                            )}
                        </CommandList>
                        {searchResults && searchResults.data.length !== 0 &&
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
                        }
                    </Command>
                </div>
            }
        </div>
    );
};


interface SearchComponentProps {
    resetSearch: () => void;
    setMobileMenu?: React.Dispatch<React.SetStateAction<boolean>>;
    item: NonNullable<Awaited<ReturnType<NonNullable<ReturnType<typeof navSearchOptions>["queryFn"]>>>>["data"][0];
}


const SearchComponent = ({ item, resetSearch, setMobileMenu }: SearchComponentProps) => {
    const router = useRouter();
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
            setMobileMenu?.(false);
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
                <div className="flex w-full gap-4 items-center">
                    <div className="relative shrink-0">
                        {item.itemType === ApiProviderType.USERS ?
                            <ProfileIcon
                                fallbackSize="text-2xl"
                                className="size-16 border-2"
                                user={{ name: item.name, image: item.image }}
                            />
                            :
                            <img
                                loading="lazy"
                                alt={item.name}
                                src={item.image}
                                className={cn("w-16 aspect-2/3 rounded-sm transition-opacity duration-200", isLoadingItem && "opacity-20")}
                            />
                        }
                        {isLoadingItem &&
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="size-8 animate-spin text-app-accent"/>
                            </div>
                        }
                    </div>
                    <div className={cn("transition-opacity duration-200 min-w-0 flex-1", isLoadingItem && "opacity-40")}>
                        <div className="font-semibold mb-2 line-clamp-2">
                            {item.name}
                        </div>
                        <div className="text-neutral-300">
                            {capitalize(item.itemType)}
                        </div>
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
