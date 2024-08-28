import {useState} from "react";
import {capitalize} from "@/lib/utils";
import {fetcher} from "@/lib/fetcherLoader";
import {useUser} from "@/providers/UserProvider";
import {Header} from "@/components/medialist/Header";
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
    loader: async ({ params, deps }) => fetcher(`/list/${params.mediaType}/${params.username}`, deps.search),
});


function MediaList() {
    const navigate = useNavigate();
    const {currentUser} = useUser();
    const apiData = Route.useLoaderData();
    const {username, mediaType} = Route.useParams();
    const isCurrent = (currentUser.id === apiData.user_data.id);
    const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

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

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Collection`} onlyHelmet>
            <Header
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
