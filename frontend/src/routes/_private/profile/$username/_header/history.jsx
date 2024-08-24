import {toast} from "sonner";
import {api} from "@/api/MyApiClient";
import {Fragment, useState} from "react";
import {formatDateTime} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {fetcher} from "@/lib/fetcherLoader";
import {Button} from "@/components/ui/button";
import {useDebounce} from "@/hooks/DebounceHook";
import {Separator} from "@/components/ui/separator";
import {Return} from "@/components/app/base/Return";
import {Payload} from "@/components/app/base/Payload";
import {Pagination} from "@/components/app/Pagination";
import {PageTitle} from "@/components/app/base/PageTitle";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {createFileRoute, Link} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    component: AllUpdates,
    loader: async ({ params }) => fetcher(`/profile/${params.username}/history`, INIT_PARAMS),
});


const INIT_PARAMS = { search: "", page: 1 };


function AllUpdates() {
    const data = Route.useLoaderData();
    const { username } = Route.useParams();
    const [search, setSearch] = useState(INIT_PARAMS.search);
    const [updates, setUpdates] = useState({
        data: data.history,
        totalPages: data.pages,
        page: data.active_page,
    });

    const fetchData = async (params) => {
        const response = await api.get(`/profile/${username}/history`, params);

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        setUpdates({
            data: response.body.data.history,
            totalPages: response.body.data.pages,
            page: response.body.data.active_page,
        });
    };

    const resetSearch = async () => {
        setSearch("");
        await fetchData(INIT_PARAMS);
    };

    const handleOnChange = async (ev) => {
        const newValue = ev.target.value;
        setUpdates({ ...updates, page: INIT_PARAMS.page });
        if (newValue === "") await resetSearch();
        setSearch(newValue);
    };

    const onChangePage = async (newPage) => {
        window.scrollTo({ top: 250, behavior: "smooth" });
        await fetchData({ search, page: newPage });
    };

    useDebounce(search, 250, fetchData, { search, page: updates.page });

    return (
        <PageTitle title="History" subtitle="History of all the updates">
            <div className="mt-3 lg:w-[1050px] w-full mx-auto">
                <div className="flex flex-wrap gap-2 justify-between mb-5">
                    <Return
                        to={`/profile/${username}`}
                        value="to profile"
                    />
                    <div className="flex gap-3 items-center">
                        <Input
                            value={search}
                            placeholder="Search by name..."
                            onChange={handleOnChange}
                            className="w-56"
                        />
                        {search &&
                            <Button size="sm" variant="secondary" onClick={resetSearch}>
                                Cancel
                            </Button>
                        }
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <div className="w-[1050px] mx-auto">
                    <div className="grid grid-cols-12 font-semibold text-center">
                        <div className="col-span-2">Media</div>
                        <div className="col-span-4">Name</div>
                        <div className="col-span-3">Update</div>
                        <div className="col-span-3">Date</div>
                    </div>
                    <Separator variant="large" className="mt-2 mb-3"/>
                    <div className="space-y-3">
                        {updates.data.map(item =>
                            <Fragment key={`${item.media_id}-${item.timestamp}`}>
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-2 mx-auto">
                                        <MediaIcon mediaType={item.media_type} size={20}/>
                                    </div>
                                    <div className="col-span-4">
                                        <Link to={`/details/${item.media_type}/${item.media_id}`} className="hover:underline">
                                            {item.media_name}
                                        </Link>
                                    </div>
                                    <div className="col-span-3">
                                        <Payload update={item}/>
                                    </div>
                                    <div className="col-span-3">
                                        {formatDateTime(item.timestamp, { includeTime: true, useLocalTz: true })}
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
                    currentPage={updates.page}
                    totalPages={updates.totalPages}
                    onChangePage={onChangePage}
                />
            </div>
        </PageTitle>
    );
}