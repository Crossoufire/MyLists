import {UserX} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/formating";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {HofCard} from "@/lib/client/components/hall-of-fame/HofCard";
import {Pagination} from "@/lib/client/components/general/Pagination";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {HofSorting, SearchTypeHoF} from "@/lib/types/zod.schema.types";
import {SearchInput} from "@/lib/client/components/general/SearchInput";
import {HofRanking} from "@/lib/client/components/hall-of-fame/HofRanking";
import {hallOfFameOptions} from "@/lib/client/react-query/query-options/query-options";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


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
    const { page = DEFAULT.page, sorting = DEFAULT.sorting, search = DEFAULT.search } = filters;

    const updateFilters = (updater: Partial<SearchTypeHoF>) => {
        navigate({ search: (prev) => ({ ...prev, ...updater }), replace: true });
    };

    return (
        <PageTitle title="Hall of Fame" subtitle="Showcase of all the active profiles ranked">
            <div className="grid grid-cols-12 mx-auto w-250 gap-x-10 max-sm:w-full max-sm:grid-cols-1">
                <div className="col-span-7 max-sm:col-span-1 w-full max-sm:mt-4 max-sm:order-2">
                    <div className="flex items-center justify-between mt-3 mb-3">
                        <div className="flex items-center justify-start gap-3">
                            <SearchInput
                                value={search}
                                className="w-55"
                                placeholder="Search by name..."
                                onChange={(val) => updateFilters({ page: 1, search: val })}
                            />
                        </div>
                        <div>
                            <Select
                                value={sorting}
                                disabled={apiData.items.length === 0}
                                onValueChange={(val) => updateFilters({ page: 1, sorting: val as HofSorting })}
                            >
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
                            message={`No users found for '${search}'`}
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
                        onChangePage={(page) => updateFilters({ page })}
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
