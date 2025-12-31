import {useState} from "react";
import {MediaType, Status} from "@/lib/utils/enums";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaListArgs} from "@/lib/types/zod.schema.types";
import {capitalize, statusUtils} from "@/lib/utils/functions";
import {Header} from "@/lib/client/components/media/base/Header";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Pagination} from "@/lib/client/components/general/Pagination";
import {MediaGrid} from "@/lib/client/components/media/base/MediaGrid";
import {MediaTable} from "@/lib/client/components/media/base/MediaTable";
import {AppliedFilters} from "@/lib/client/components/media/base/AppliedFilters";
import {TabHeader, TabItem} from "@/lib/client/components/user-profile/TabHeader";
import {FiltersSideSheet} from "@/lib/client/components/media/base/FiltersSideSheet";
import {mediaListOptions} from "@/lib/client/react-query/query-options/query-options";


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
    const filters = Route.useSearch();
    const { currentUser } = useAuth();
    const navigate = Route.useNavigate();
    const { username, mediaType } = Route.useParams();
    const allStatuses = statusUtils.byMediaType(mediaType);
    const [isGrid, setIsGrid] = useState(currentUser?.gridListView ?? true);
    const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
    const apiData = useSuspenseQuery(mediaListOptions(mediaType, username, filters)).data;
    const [activeTab, setActiveTab] = useState<Status | "all">("all");

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

    const statusTabs: TabItem<Status | "all">[] = [
        {
            id: "all",
            label: "All",
            isAccent: true,
        },
        ...allStatuses.map((status) => ({
            id: status,
            label: status,
        }))
    ];

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Collection`} onlyHelmet>
            <Header
                isGrid={isGrid}
                username={username}
                mediaType={mediaType}
                userData={apiData.userData}
                pagination={apiData.results.pagination}
                onGridClick={() => setIsGrid(!isGrid)}
                onFilterClick={() => setFiltersPanelOpen(true)}
                onSortChange={({ sort }) => handleFilterChange({ sort })}
                onSearchEnter={({ search }) => handleFilterChange({ search })}
            />
            <AppliedFilters
                filters={filters}
                mediaType={mediaType}
                totalItems={apiData.results.pagination.totalItems}
                onFilterRemove={(filters) => handleFilterChange(filters)}
            />
            <div className="mt-2 mb-6">
                <TabHeader
                    tabs={statusTabs}
                    activeTab={activeTab}
                    setActiveTab={(status) => {
                        setActiveTab(status);
                        // @ts-expect-error - Can be "all"
                        handleFilterChange({ status: [...(filters.status || []), status] });
                    }}
                />
            </div>

            {isGrid ?
                <MediaGrid
                    isCurrent={isCurrent}
                    mediaType={mediaType}
                    mediaItems={apiData.results.items}
                    queryOption={mediaListOptions(mediaType, username, filters)}
                />
                :
                <MediaTable
                    mediaType={mediaType}
                    isCurrent={isCurrent}
                    results={apiData.results}
                    queryOption={mediaListOptions(mediaType, username, filters)}
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
