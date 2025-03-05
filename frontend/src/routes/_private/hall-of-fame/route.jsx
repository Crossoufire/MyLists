import {useState} from "react";
import {Search} from "lucide-react";
import {hallOfFameOptions} from "@/api";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {PageTitle} from "@/components/app/PageTitle";
import {MutedText} from "@/components/app/MutedText";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Pagination} from "@/components/app/Pagination";
import {useDebounceCallback} from "@/hooks/useDebounce";
import {HoFCard} from "@/components/hall-of-fame/HoFCard";
import {HofRanking} from "@/components/hall-of-fame/HofRanking";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/hall-of-fame")({
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => queryClient.ensureQueryData(hallOfFameOptions(search)),
    component: HallOfFamePage,
});


const DEFAULT = { page: 1, search: "", sorting: "normalized" };


function HallOfFamePage() {
    const navigate = useNavigate();
    const filters = Route.useSearch();
    const apiData = useSuspenseQuery(hallOfFameOptions(filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const { sorting = DEFAULT.sorting, page = DEFAULT.page, search = DEFAULT.search } = filters;

    const fetchData = async (params) => {
        // noinspection JSCheckFunctionSignatures
        await navigate({ search: params });
    };

    const resetSearch = async () => {
        setCurrentSearch(DEFAULT.search);
        await fetchData((prev) => ({ ...prev, search: DEFAULT.search }));
    };

    const onPageChange = async (newPage) => {
        await fetchData({ search, page: newPage, sorting });
    };

    const onSortChanged = async (sorting) => {
        await fetchData({ search, page: 1, sorting });
    };

    useDebounceCallback(currentSearch, 400, fetchData, { search: currentSearch, page: DEFAULT.page, sorting });

    return (
        <PageTitle title="Hall of Fame" subtitle="Showcase of profiles ranked by profile level">
            <div className="grid grid-cols-12 mx-auto w-[1000px] gap-x-10 max-sm:w-full max-sm:grid-cols-1">
                <div className="col-span-7 max-sm:col-span-1 w-full max-sm:mt-4 max-sm:order-2">
                    <div className="flex items-center justify-between mt-5 mb-3">
                        <div className="flex items-center justify-start gap-3">
                            <div className="relative">
                                <Input
                                    value={currentSearch}
                                    className="pl-10 rounded-md w-[180px]"
                                    placeholder="Search by username"
                                    onChange={(ev) => setCurrentSearch(ev.target.value)}
                                />
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                />
                            </div>
                            {search && (
                                <Button size="sm" onClick={resetSearch}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                        <div>
                            <Select
                                value={sorting}
                                onValueChange={onSortChanged}
                                disabled={apiData.items.length === 0}
                            >
                                <SelectTrigger className="w-[130px] font-medium bg-outline border">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normalized">Normalized</SelectItem>
                                    <SelectItem value="profile">Profile</SelectItem>
                                    <SelectItem value="series">Series</SelectItem>
                                    <SelectItem value="anime">Anime</SelectItem>
                                    <SelectItem value="movies">Movies</SelectItem>
                                    <SelectItem value="books">Books</SelectItem>
                                    <SelectItem value="games">Games</SelectItem>
                                    <SelectItem value="manga">Manga</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {apiData.items.length === 0 ? (
                        <MutedText>No users found.</MutedText>
                    ) : (
                        apiData.items.map((user) => (
                            <HoFCard user={user} key={user.username}/>
                        ))
                    )}
                    <Pagination
                        currentPage={page}
                        totalPages={apiData.pages}
                        onChangePage={onPageChange}
                    />
                </div>
                <div className="col-span-5 max-sm:col-span-1 mt-[28px] max-sm:mt-4 max-sm:order-1">
                    <HofRanking
                        userRanks={apiData.user_ranks}
                    />
                </div>
            </div>
        </PageTitle>
    );
}
