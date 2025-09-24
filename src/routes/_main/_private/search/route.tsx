import React, {useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Card} from "@/lib/client/components/ui/card";
import {Input} from "@/lib/client/components/ui/input";
import {Badge} from "@/lib/client/components/ui/badge";
import {formatDateTime} from "@/lib/utils/functions";
import {createFileRoute, Link} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {ApiProviderType, MediaType} from "@/lib/utils/enums";
import {navSearchOptions} from "@/lib/client/react-query/query-options/query-options";
import {BookImage, Cat, Gamepad2, Library, Monitor, Popcorn, Search, User} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


type GlobalSearch = { query?: string, apiProvider?: ApiProviderType };


export const Route = createFileRoute("/_main/_private/search")({
    validateSearch: (search) => search as GlobalSearch,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        const { query = DEFAULT.query, apiProvider = DEFAULT.apiProvider } = search;
        return queryClient.ensureQueryData(navSearchOptions(query, 1, apiProvider));
    },
    component: SearchPage,
});


const DEFAULT = { query: "", apiProvider: ApiProviderType.TMDB } satisfies GlobalSearch;


function SearchPage() {
    const { currentUser } = useAuth();
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { query = DEFAULT.query, apiProvider = DEFAULT.apiProvider } = filters;

    const [selectDrop, setSelectDrop] = useState(apiProvider);
    const [currentSearch, setCurrentSearch] = useState(query);
    const apiData = useSuspenseQuery(navSearchOptions(query, 1, apiProvider)).data;

    const fetchData = async (params: GlobalSearch) => {
        await navigate({ search: params });
    };

    const onSearchEnter = async (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.key !== "Enter") return;

        if (currentSearch === "") {
            setCurrentSearch(DEFAULT.query);
        }

        setCurrentSearch(currentSearch);
        await fetchData({ query: currentSearch, apiProvider: selectDrop });
    }

    const onTypeChanged = async (value: ApiProviderType) => {
        setSelectDrop(value);
    };

    return (
        <PageTitle title="Search" subtitle="Search for movies, TV shows, users, and more.">
            <div className="flex justify-center items-center gap-3 mt-3 mb-6">
                <div className="relative max-sm:w-full">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-4"/>
                    <Input
                        type="search"
                        value={currentSearch}
                        onKeyDown={(ev) => onSearchEnter(ev)}
                        placeholder="Search for media/users..."
                        className="pl-8 rounded-md w-[450px] max-sm:w-full"
                        onChange={(ev) => setCurrentSearch(ev.target.value)}
                    />
                </div>
                <Select value={selectDrop} onValueChange={(value: ApiProviderType) => onTypeChanged(value)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
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
                    </SelectContent>
                </Select>
            </div>

            {apiData.data.length > 0 &&
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-foreground">
                            Search Results
                        </h2>
                        <Badge variant="secondary" className="text-base px-3">
                            {apiData.data.length} Results
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
                        {apiData.data.map((item) =>
                            <Card key={item.id} className="rounded-lg py-0 border-none">
                                <div className="relative aspect-[2/3] h-full rounded-lg border border-black">
                                    {item.itemType === ApiProviderType.USERS ?
                                        <Link to="/profile/$username" params={{ username: item.name }}>
                                            <img
                                                alt={item.name}
                                                src={item.image}
                                                className="object-cover w-full h-full rounded-lg"
                                            />
                                        </Link>
                                        :
                                        <Link
                                            search={{ external: true }}
                                            to="/details/$mediaType/$mediaId"
                                            params={{ mediaType: item.itemType as MediaType, mediaId: item.id }}
                                        >
                                            <img
                                                alt={item.name}
                                                src={item.image}
                                                className="object-cover w-full h-full rounded-lg"
                                            />
                                        </Link>
                                    }
                                    <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-1 bg-gray-900 w-full rounded-b-sm text-center">
                                        <div className="truncate">{item.name}</div>
                                        <div>{formatDateTime(item.date, { noTime: true })}</div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            }

            {(apiData.data.length === 0 && query) &&
                <div className="text-center py-12">
                    <div className="text-muted-foreground">
                        <Search className="size-10 mx-auto mb-4 opacity-70"/>
                        <p className="text-lg font-medium">No results found</p>
                        <p>Try adjusting your search query or selecting a different provider</p>
                    </div>
                </div>
            }

            {(apiData.data.length === 0 && !query) &&
                <div className="text-center py-10">
                    <div className="text-muted-foreground mb-8">
                        <div className="flex justify-center gap-4 mb-6">
                            <Popcorn className="size-8 opacity-70"/>
                            <Monitor className="size-8 opacity-70"/>
                            <Cat className="size-8 opacity-70"/>
                            <Gamepad2 className="size-8 opacity-70"/>
                            <Library className="size-8 opacity-70"/>
                            <BookImage className="size-8 opacity-70"/>
                            <User className="size-8 opacity-70"/>
                        </div>
                        <p className="text-xl font-medium">Ready to search</p>
                        <p>Enter your search query to get started</p>
                    </div>
                </div>
            }
        </PageTitle>
    );
}
