import {Search, UserX} from "lucide-react";
import React, {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/functions";
import {Input} from "@/lib/client/components/ui/input";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";
import {HofCard} from "@/lib/client/components/hall-of-fame/HofCard";
import {Pagination} from "@/lib/client/components/general/Pagination";
import {HofSorting, SearchTypeHoF} from "@/lib/types/zod.schema.types";
import {HofRanking} from "@/lib/client/components/hall-of-fame/HofRanking";
import {hallOfFameOptions} from "@/lib/client/react-query/query-options/query-options";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";


export const Route = createFileRoute("/_main/_private/hall-of-fame")({
    validateSearch: (search) => search as SearchTypeHoF,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => queryClient.ensureQueryData(hallOfFameOptions(search)),
    component: HallOfFamePage,
});


const DEFAULT = { page: 1, search: "", sorting: "normalized" } satisfies SearchTypeHoF;


function HallOfFamePage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const apiData = useSuspenseQuery(hallOfFameOptions(filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const { page = DEFAULT.page, sorting = DEFAULT.sorting, search = DEFAULT.search } = filters;

    const fetchData = async (params: SearchTypeHoF) => {
        await navigate({ search: params });
    };

    const onSearchChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = ev.target.value;
        setCurrentSearch(value);
        if (value === "") {
            setCurrentSearch(DEFAULT.search);
            await fetchData({ ...filters, search: DEFAULT.search });
        }
    }

    const onPageChange = async (page: number) => {
        await fetchData({ page, sorting, search });
    };

    const onSortChanged = async (value: string) => {
        const sorting: HofSorting = value as HofSorting;
        await fetchData({ page: 1, sorting, search });
    };

    useDebounceCallback(currentSearch, 400, () => fetchData({ search: currentSearch, sorting, page: 1 }));

    return (
        <PageTitle title="Hall of Fame" subtitle="Showcase of all the active profiles ranked">
            <div className="grid grid-cols-12 mx-auto w-250 gap-x-10 max-sm:w-full max-sm:grid-cols-1 mt-6">
                <div className="col-span-7 max-sm:col-span-1 w-full max-sm:mt-4 max-sm:order-2">
                    <div className="flex items-center justify-between mt-3 mb-3">
                        <div className="flex items-center justify-start gap-3">
                            <div className="relative">
                                <Input
                                    type="search"
                                    value={currentSearch}
                                    onChange={onSearchChange}
                                    placeholder="Search by name..."
                                    className="pl-10 rounded-md w-55 max-sm:text-sm"
                                />
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                />
                            </div>
                        </div>
                        <div>
                            <Select value={sorting} onValueChange={onSortChanged} disabled={apiData.items.length === 0}>
                                <SelectTrigger className="w-32.5 font-medium bg-outline border">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normalized">Normalized</SelectItem>
                                    <SelectItem value="profile">Profile</SelectItem>
                                    {Object.values(MediaType).map((mt) =>
                                        <SelectItem key={mt} value={mt}>
                                            {capitalize(mt)}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {apiData.items.length === 0 ?
                        <EmptyState
                            icon={UserX}
                            message={`No users found for '${currentSearch}'`}
                        />
                        :
                        apiData.items.map((userData) =>
                            <HofCard
                                key={userData.name}
                                userData={userData}
                            />
                        )
                    }
                    <Pagination
                        currentPage={page}
                        totalPages={apiData.pages}
                        onChangePage={onPageChange}
                    />
                </div>
                <div className="col-span-5 max-sm:col-span-1 mt-5.25 max-sm:mt-4 max-sm:order-1">
                    <HofRanking
                        userRanks={apiData.userRanks}
                    />
                </div>
            </div>
        </PageTitle>
    );
}
