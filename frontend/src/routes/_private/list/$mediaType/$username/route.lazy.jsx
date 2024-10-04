import {useState} from "react";
import {useAuth} from "@/hooks/AuthHook";
import {capitalize} from "@/utils/functions";
import {listOptions} from "@/api/queryOptions";
import {Header} from "@/components/medialist/Header";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Pagination} from "@/components/app/Pagination";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaGrid} from "@/components/medialist/MediaGrid";
import {MediaTable} from "@/components/medialist/MediaTable";
import {AppliedFilters} from "@/components/medialist/AppliedFilters";
import {createLazyFileRoute, useNavigate} from "@tanstack/react-router";
import {FiltersSideSheet} from "@/components/medialist/FiltersSideSheet";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/list/$mediaType/$username")({
    component: MediaList,
});


function MediaList() {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const { currentUser } = useAuth();
    const { username, mediaType } = Route.useParams();
    const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
    const apiData = useSuspenseQuery(listOptions(mediaType, username, search)).data;
    const [isGrid, setIsGrid] = useState(currentUser?.grid_list_view ?? true);
    const isCurrent = (currentUser?.id === apiData.user_data.id);

    const handleFilterChange = async (newFilters) => {
        const page = newFilters.page || 1;
        await navigate({
            search: (prev) => {
                const updatedSearch = { ...prev };

                Object.entries(newFilters).forEach(([key, valueOrArray]) => {
                    if (
                        valueOrArray === false ||
                        valueOrArray === null ||
                        (Array.isArray(valueOrArray) && valueOrArray.length === 0)
                    ) {
                        delete updatedSearch[key];
                    }
                    else if (Array.isArray(prev[key])) {
                        const oldSet = new Set(prev[key]);
                        // noinspection JSCheckFunctionSignatures
                        const newSet = new Set(valueOrArray);

                        const toAdd = valueOrArray.filter((item) => !oldSet.has(item));
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
                userData={apiData.user_data}
                pagination={apiData.pagination}
                onGridClick={() => setIsGrid(!isGrid)}
                onFilterClick={() => setFiltersPanelOpen(true)}
                onStatusChange={(status) => handleFilterChange(status)}
                onSortChange={(sort) => handleFilterChange({ sort: sort })}
                onSearchEnter={(search) => handleFilterChange({ search: search })}
            />
            <AppliedFilters
                total={apiData.pagination.total}
                onFilterRemove={(filters) => handleFilterChange(filters)}
            />
            {isGrid ?
                <MediaGrid
                    isCurrent={isCurrent}
                    mediaType={mediaType}
                    mediaList={apiData.media_data}
                    allStatus={apiData.pagination.all_status}
                    queryKey={["userList", mediaType, username, search]}
                />
                :
                <MediaTable
                    mediaType={mediaType}
                    isCurrent={isCurrent}
                    mediaList={apiData.media_data}
                    pagination={apiData.pagination}
                    queryKey={["userList", mediaType, username, search]}
                    onChangePage={(data) => handleFilterChange({ page: data.pageIndex + 1 })}
                />
            }
            {isGrid &&
                <Pagination
                    currentPage={apiData.pagination.page}
                    totalPages={apiData.pagination.pages}
                    onChangePage={(page) => handleFilterChange({ page })}
                />
            }
            {filtersPanelOpen &&
                <FiltersSideSheet
                    isCurrent={isCurrent}
                    allStatus={apiData.pagination.all_status}
                    onClose={() => setFiltersPanelOpen(false)}
                    onFilterApply={(filters) => handleFilterChange(filters)}
                />
            }
        </PageTitle>
    );
}
