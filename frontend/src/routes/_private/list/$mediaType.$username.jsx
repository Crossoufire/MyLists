import {useState} from "react";
import {capitalize} from "@/utils/functions";
import {useUser} from "@/providers/UserProvider";
import {queryOptionsMap} from "@/utils/mutations";
import {Header} from "@/components/medialist/Header";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Pagination} from "@/components/app/Pagination";
import {PageTitle} from "@/components/app/base/PageTitle";
import {MediaGrid} from "@/components/medialist/MediaGrid";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {AppliedFilters} from "@/components/medialist/AppliedFilters";
import {FiltersSideSheet} from "@/components/medialist/FiltersSideSheet";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/list/$mediaType/$username")({
    component: MediaList,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { mediaType, username }, deps: { search } }) => {
        return queryClient.ensureQueryData(queryOptionsMap.list(mediaType, username, search))
    },
});


function MediaList() {
    const navigate = useNavigate();
    const {currentUser} = useUser();
    const search = Route.useSearch();
    const {username, mediaType} = Route.useParams();
    const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
    const apiData = useSuspenseQuery(queryOptionsMap.list(mediaType, username, search)).data;
    const isCurrent = (currentUser.id === apiData.user_data.id);

    const handleFilterChange = async (newFilters) => {
        const page = newFilters.page || 1;
        await navigate({
            search: (prev) => {
                const updatedSearch = { ...prev };

                Object.entries(newFilters).forEach(([key, valueOrArray]) => {
                    if (valueOrArray === false || valueOrArray === null ||
                        Array.isArray(valueOrArray) && valueOrArray.length === 0) {
                        delete updatedSearch[key];
                    }
                    else if (Array.isArray(prev[key])) {
                        const oldSet = new Set(prev[key]);
                        // noinspection JSCheckFunctionSignatures
                        const newSet = new Set(valueOrArray);

                        const toAdd = valueOrArray.filter(item => !oldSet.has(item));
                        const toKeep = prev[key].filter(item => !newSet.has(item));
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

    console.log(apiData);

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Collection`} onlyHelmet>
            <Header
                isCurrent={isCurrent}
                userData={apiData.user_data}
                pagination={apiData.pagination}
                onFilterClick={() => setFiltersPanelOpen(true)}
                onStatusChange={(status) => handleFilterChange(status)}
                listName={`${username} ${capitalize(mediaType)} Collection`}
                onSortChange={(sort) => handleFilterChange({ sort: sort })}
                onSearchEnter={(search) => handleFilterChange({ search: search })}
            />
            <AppliedFilters
                total={apiData.pagination.total}
                onFilterRemove={(filters) => handleFilterChange(filters)}
            />
            <MediaGrid
                isCurrent={isCurrent}
                mediaList={apiData.media_data}
                key={`${username}-${mediaType}`}
            />
            <Pagination
                currentPage={apiData.pagination.page}
                totalPages={apiData.pagination.pages}
                onChangePage={(page) => handleFilterChange({ page })}
            />
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
