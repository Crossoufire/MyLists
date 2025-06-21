import {useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {capitalize} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {Header} from "@/lib/components/media-list/Header";
import {Pagination} from "@/lib/components/app/Pagination";
import {MediaGrid} from "@/lib/components/media-list/MediaGrid";
import {MediaTable} from "@/lib/components/media-list/MediaTable";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {AppliedFilters} from "@/lib/components/media-list/AppliedFilters";
import {FiltersSideSheet} from "@/lib/components/media-list/FiltersSideSheet";
import {mediaListOptions, queryKeys} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_private/list/$mediaType/$username")({
    params: {
        parse: (params) => ({
            username: params.username,
            mediaType: params.mediaType as MediaType,
        })
    },
    validateSearch: (search: any) => search as MediaListArgs,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { mediaType, username }, deps: { search } }) => {
        return queryClient.ensureQueryData(mediaListOptions(mediaType, username, search));
    },
    component: MediaList,
});


function MediaList() {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const { currentUser } = useAuth();
    const { username, mediaType } = Route.useParams();
    const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
    const [isGrid, setIsGrid] = useState(currentUser?.gridListView ?? true);
    const apiData = useSuspenseQuery(mediaListOptions(mediaType, username, search)).data;

    // @ts-expect-error
    const isCurrent = (parseInt(currentUser?.id) === apiData.userData.id);

    const handleFilterChange = async (newFilters: Partial<typeof search>) => {
        const page = newFilters.page || 1;
        await navigate({
            // @ts-expect-error
            search: (prev) => {
                const updatedSearch = { ...prev };

                Object.entries(newFilters).forEach(([key, valueOrArray]) => {
                    if (
                        valueOrArray === false || valueOrArray === null ||
                        (Array.isArray(valueOrArray) && valueOrArray.length === 0)
                    ) {
                        delete updatedSearch[key];
                    }
                    else if (Array.isArray(prev[key])) {
                        const oldSet = new Set(prev[key]);
                        //@ts-expect-error
                        const newSet = new Set(valueOrArray);
                        //@ts-expect-error
                        const toAdd = valueOrArray.filter((item: any) => !oldSet.has(item));
                        const toKeep = prev[key].filter((item) => !newSet.has(item));
                        updatedSearch[key] = [...toKeep, ...toAdd];

                        if (updatedSearch[key].length === 0) {
                            delete updatedSearch[key];
                        }
                    }
                    else {
                        updatedSearch[key] = valueOrArray;
                    }
                });

                return { ...updatedSearch, page };
            },
        });
    };

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Collection`} onlyHelmet>
            <Header
                isGrid={isGrid}
                userData={apiData.userData}
                pagination={apiData.results.pagination}
                onGridClick={() => setIsGrid(!isGrid)}
                onFilterClick={() => setFiltersPanelOpen(true)}
                onSortChange={({ sort }) => handleFilterChange({ sort })}
                onSearchEnter={({ search }) => handleFilterChange({ search })}
                onStatusChange={({ status }) => handleFilterChange({ status })}
            />
            <AppliedFilters
                totalItems={apiData.results.pagination.totalItems}
                onFilterRemove={(filters: any) => handleFilterChange(filters)}
            />
            {isGrid ?
                <MediaGrid
                    isCurrent={isCurrent}
                    mediaType={mediaType}
                    items={apiData.results.items}
                    queryKey={queryKeys.userListKey(mediaType, username, search)}
                />
                :
                <MediaTable
                    mediaType={mediaType}
                    isCurrent={isCurrent}
                    results={apiData.results}
                    queryKey={queryKeys.userListKey(mediaType, username, search)}
                    onChangePage={(data: any) => handleFilterChange({ page: data.pageIndex + 1 })}
                />
            }
            {isGrid &&
                <Pagination
                    currentPage={apiData.results.pagination.page}
                    totalPages={apiData.results.pagination.totalPages}
                    onChangePage={(page: number) => handleFilterChange({ page })}
                />
            }
            {filtersPanelOpen &&
                <FiltersSideSheet
                    isCurrent={isCurrent}
                    onClose={() => setFiltersPanelOpen(false)}
                    onFilterApply={(filters) => handleFilterChange(filters)}
                />
            }
        </PageTitle>
    );
}
