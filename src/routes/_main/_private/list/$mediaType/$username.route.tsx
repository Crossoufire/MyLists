import {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {capitalize, statusUtils} from "@/lib/utils/functions";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaListArgs} from "@/lib/types/zod.schema.types";
import {Header} from "@/lib/client/components/media/base/Header";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Pagination} from "@/lib/client/components/general/Pagination";
import {MediaGrid} from "@/lib/client/components/media/base/MediaGrid";
import {MediaTable} from "@/lib/client/components/media/base/MediaTable";
import {AppliedFilters} from "@/lib/client/components/media/base/AppliedFilters";
import {FiltersSideSheet} from "@/lib/client/components/media/base/FiltersSideSheet";
import {mediaListOptions} from "@/lib/client/react-query/query-options/query-options";
import {TabHeader} from "@/lib/client/components/user-profile/TabHeader";


export const Route = createFileRoute("/_main/_private/list/$mediaType/$username")({
    params: {
        parse: (params) => ({
            username: params.username,
            mediaType: params.mediaType as MediaType,
        })
    },
    validateSearch: (search) => search as MediaListArgs,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, params: { mediaType, username }, deps: { search } }) => {
        return queryClient.ensureQueryData(mediaListOptions(mediaType, username, search));
    },
    component: MediaList,
});


function MediaList() {
    const search = Route.useSearch();
    const { currentUser } = useAuth();
    const navigate = Route.useNavigate();
    const { username, mediaType } = Route.useParams();
    const allStatuses = statusUtils.byMediaType(mediaType);
    const [isGrid, setIsGrid] = useState(currentUser?.gridListView ?? true);
    const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
    const apiData = useSuspenseQuery(mediaListOptions(mediaType, username, search)).data;
    const [activeTab, setActiveTab] = useState<typeof allStatuses | "overview">("overview");

    const isCurrent = (currentUser?.id === apiData.userData.id);

    const handleFilterChange = async (newFilters: Partial<MediaListArgs>) => {
        const page = newFilters.page || 1;
        await navigate({
            search: (prev) => {
                const updatedSearch = { ...prev };

                Object.entries(newFilters).forEach(([key, item]) => {
                    const typedKey = key as keyof MediaListArgs;
                    const prevValue = prev[typedKey];

                    if (item === false || item === null || (Array.isArray(item) && item.length === 0)) {
                        delete updatedSearch[typedKey];
                    }
                    else if (Array.isArray(prevValue) && Array.isArray(item)) {
                        const oldSet = new Set(prevValue);
                        const newSet = new Set(item);
                        const toAdd = item.filter((i) => !oldSet.has(i));
                        const toKeep = prevValue.filter((i) => !newSet.has(i));
                        const merged = [...toKeep, ...toAdd];
                        if (merged.length === 0) {
                            delete updatedSearch[typedKey];
                        }
                        else {
                            updatedSearch[typedKey] = merged as any;
                        }
                    }
                    else {
                        updatedSearch[typedKey] = item as any;
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
            />
            <AppliedFilters
                totalItems={apiData.results.pagination.totalItems}
                onFilterRemove={(filters) => handleFilterChange(filters)}
            />

            <div className="mb-8 -mt-4">
                <TabHeader
                    activeTab={activeTab}
                    mediaTypes={allStatuses}
                    setActiveTab={(status) => {
                        setActiveTab(status);
                        handleFilterChange({ status: [...(search.status || []), status] });
                    }}
                />
            </div>

            {isGrid ?
                <MediaGrid
                    isCurrent={isCurrent}
                    mediaType={mediaType}
                    mediaItems={apiData.results.items}
                    queryOption={mediaListOptions(mediaType, username, search)}
                />
                :
                <MediaTable
                    mediaType={mediaType}
                    isCurrent={isCurrent}
                    results={apiData.results}
                    queryOption={mediaListOptions(mediaType, username, search)}
                    onChangePage={(filters) => handleFilterChange(filters)}
                />
            }
            {isGrid &&
                <Pagination
                    currentPage={apiData.results.pagination.page}
                    totalPages={apiData.results.pagination.totalPages}
                    onChangePage={(page) => handleFilterChange({ page })}
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
