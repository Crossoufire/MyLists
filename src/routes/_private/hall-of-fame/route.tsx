import {useState} from "react";
import {Search} from "lucide-react";
import {Input} from "@/lib/components/ui/input";
import {capitalize} from "@/lib/utils/functions";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {MutedText} from "@/lib/components/app/MutedText";
import {Pagination} from "@/lib/components/app/Pagination";
import {useDebounceCallback} from "@/lib/hooks/use-debounce";
import {HoFCard} from "@/lib/components/hall-of-fame/HoFCard";
import {HofRanking} from "@/lib/components/hall-of-fame/HofRanking";
import {HofSorting, SearchTypeHoF} from "@/lib/server/types/base.types";
import {hallOfFameOptions} from "@/lib/react-query/query-options/query-options";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


export const Route = createFileRoute("/_private/hall-of-fame")({
    validateSearch: (search) => search as SearchTypeHoF,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => queryClient.ensureQueryData(hallOfFameOptions(search)),
    component: HallOfFamePage,
});


const DEFAULT = { page: 1, search: "", sorting: "normalized" } satisfies SearchTypeHoF;


function HallOfFamePage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const apiData = useSuspenseQuery(hallOfFameOptions(filters)).data!;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const { page = DEFAULT.page, sorting = DEFAULT.sorting, search = DEFAULT.search } = filters;

    const fetchData = async (params: SearchTypeHoF) => {
        await navigate({ search: params });
    };

    const resetSearch = async () => {
        setCurrentSearch(DEFAULT.search);
        await fetchData({ ...filters, search: DEFAULT.search });
    };

    const onPageChange = async (page: number) => {
        await fetchData({ page, sorting, search });
    };

    const onSortChanged = async (sorting: HofSorting) => {
        await fetchData({ page: 1, sorting, search });
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
                                    placeholder="Search by name..."
                                    className="pl-10 rounded-md w-[180px]"
                                    onChange={(ev) => setCurrentSearch(ev.target.value)}
                                />
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                />
                            </div>
                            {search && <Button size="sm" onClick={resetSearch}>Cancel</Button>}
                        </div>
                        <div>
                            <Select value={sorting} onValueChange={onSortChanged} disabled={apiData.items.length === 0}>
                                <SelectTrigger className="w-[130px] font-medium bg-outline border">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normalized">Normalized</SelectItem>
                                    <SelectItem value="profile">Profile</SelectItem>
                                    {Object.values(MediaType).map(mt =>
                                        <SelectItem key={mt} value={mt}>
                                            {capitalize(mt)}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {apiData.items.length === 0 ?
                        <MutedText>No users found.</MutedText>
                        :
                        apiData.items.map((user) =>
                            <HoFCard
                                user={user}
                                key={user.name}
                            />
                        )
                    }
                    <Pagination
                        currentPage={page}
                        totalPages={apiData.pages}
                        onChangePage={onPageChange}
                    />
                </div>
                <div className="col-span-5 max-sm:col-span-1 mt-[28px] max-sm:mt-4 max-sm:order-1">
                    <HofRanking
                        userRanks={apiData.userRanks}
                    />
                </div>
            </div>
        </PageTitle>
    );
}
