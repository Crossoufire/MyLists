import {FaTimes} from "react-icons/fa";
import {Fragment, useState} from "react";
import {createLocalDate} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {fetcher} from "@/lib/fetcherLoader";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {Return} from "@/components/app/base/Return";
import {Payload} from "@/components/app/base/Payload";
import {Pagination} from "@/components/app/Pagination";
import {PageTitle} from "@/components/app/base/PageTitle";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    component: AllUpdates,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ deps, params }) => fetcher(`/user/${params.username}/media-history`, deps.search),
});


const DEFAULT = { search: "", page: 1 };


function AllUpdates() {
    const navigate = useNavigate();
    const apiData = Route.useLoaderData();
    const { username } = Route.useParams();
    const { page = DEFAULT.page, search = DEFAULT.search } = Route.useSearch();
    const [currentSearch, setCurrentSearch] = useState(search);

    const fetchData = async (params) => {
        // noinspection JSCheckFunctionSignatures
        await navigate({ search: params });
    };

    const resetFilters = async () => {
        setCurrentSearch(DEFAULT.search);
        await fetchData(DEFAULT);
    };

    const onSearchEnter = async (ev) => {
        const newSearch = ev.target.value;
        if (ev.key !== "Enter" || newSearch.length < 1) {
            return;
        }
        await fetchData({ search: newSearch, page: 1 });
    };

    const onPageChange = async(newPage) => {
        await fetchData({ search, page: newPage });
    };

    return (
        <PageTitle title="History" subtitle="History of all the user's updates">
            <div className="mt-3 lg:w-[1050px] w-full mx-auto">
                <div className="flex flex-wrap gap-2 justify-between mb-5">
                    <Return
                        value={"to profile"}
                        to={`/profile/${username}`}
                    />
                    <div className="flex gap-3 items-center">
                        <Input
                            value={currentSearch}
                            onKeyUp={onSearchEnter}
                            className={"rounded-md w-56"}
                            placeholder={"Search by name"}
                            onChange={(ev) => setCurrentSearch(ev.target.value)}
                        />
                        {currentSearch &&
                            <Button variant="ghost" size="icon" onClick={resetFilters}>
                                <FaTimes/>
                            </Button>
                        }
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <div className="w-[1050px] mx-auto">
                    <div className="grid grid-cols-12 font-semibold text-center">
                        <div className="col-span-1">Media</div>
                        <div className="col-span-5">Name</div>
                        <div className="col-span-3">Update</div>
                        <div className="col-span-3">Date</div>
                    </div>
                    <Separator variant="large" className="mt-2 mb-3"/>
                    <div className="space-y-3">
                        {apiData.data.map(item =>
                            <Fragment key={`${item.media_id}-${item.timestamp}`}>
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-1 mx-auto">
                                        <MediaIcon mediaType={item.media_type} size={20}/>
                                    </div>
                                    <div className="col-span-5 line-clamp-1">
                                        <Link to={`/details/${item.media_type}/${item.media_id}`}
                                        className="hover:underline" title={item.media_name}>
                                            {item.media_name}
                                        </Link>
                                    </div>
                                    <div className="col-span-3">
                                        <Payload
                                            updateType={item.update_type}
                                            payload={item.update_data}
                                        />
                                    </div>
                                    <div className="col-span-3 text-center">
                                        {createLocalDate(item.timestamp, true)}
                                    </div>
                                </div>
                                <Separator/>
                            </Fragment>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center">
                <Pagination
                    currentPage={page}
                    onChangePage={onPageChange}
                    totalPages={apiData.pagination.pages}
                />
            </div>
        </PageTitle>
    );
}