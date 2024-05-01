import {toast} from "sonner";
import {createLocalDate} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useDebounce} from "@/hooks/DebounceHook";
import {Separator} from "@/components/ui/separator";
import {Fragment, useEffect, useState} from "react";
import {PageTitle} from "@/components/app/PageTitle";
import {Return} from "@/components/app/base/Return";
import {Payload} from "@/components/app/base/Payload";
import {Loading} from "@/components/app/base/Loading";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {Pagination} from "@/components/app/Pagination.jsx";


const INIT_PARAMS = { search: "", page: 1 };


export const AllUpdates = ({ username }) => {
    const api = useApi();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(INIT_PARAMS.search);
    const [updates, setUpdates] = useState({
        data: [],
        totalPages: 0,
        page: INIT_PARAMS.page,
    });

    const fetchData = async (params) => {
        const response = await api.get(`/profile/${username}/history`, {
            search: params.search,
            page: params.page,
        });

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
        await fetchData({ search: INIT_PARAMS.search, page: INIT_PARAMS.page });
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchData({ search: INIT_PARAMS.search, page: INIT_PARAMS.page });
            setLoading(false);
        })();
    }, []);

    const handleOnChange = (ev) => {
        setUpdates({ ...updates, page: INIT_PARAMS.page });

        if (ev.target.value === "") {
            void resetSearch();
        }

        setSearch(ev.target.value);
    };

    const onChangePage = (newPage) => void fetchData({ search: search, page: newPage });

    useDebounce(search, 200, fetchData, { search: search, page: updates.page });

    return (
        <PageTitle title="History" subtitle="History of all the updates">
            {loading ?
                <Loading className="mt-4" forPage={false}/>
                :
                <>
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
                                    <Fragment key={`${item.media_id}-${item.date}`}>
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-2 mx-auto">
                                                <MediaIcon mediaType={item.media_type} size={20}/>
                                            </div>
                                            <div className="col-span-4">{item.media_name}</div>
                                            <div className="col-span-3"><Payload payload={item.update}/></div>
                                            <div className="col-span-3">{createLocalDate(item.date, true)}</div>
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
                </>
            }
        </PageTitle>
    );
};
