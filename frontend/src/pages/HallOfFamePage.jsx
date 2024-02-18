import {toast} from "sonner";
import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {ErrorPage} from "@/pages/ErrorPage";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useDebounce} from "@/hooks/DebouceHook";
import {HoFCard} from "@/components/hof/HoFCard";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {Pagination} from "@/components/primitives/Pagination";


const INIT_PARAMS = { search: "", page: 1 };

export const HallOfFamePage = () => {
    const api = useApi();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(INIT_PARAMS.search);
    const [users, setUsers] = useState({
        data: [],
        totalPages: 0,
        page: INIT_PARAMS.page
    });

    const fetchData = async (params) => {
        const response = await api.get("/hall_of_fame", {
            search: params.search,
            page: params.page,
        });

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        setUsers({
            data: response.body.data.users,
            totalPages: response.body.data.pages,
            page: response.body.data.page,
        });
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchData({ search: INIT_PARAMS.search, page: INIT_PARAMS.page });
            setLoading(false);
        })();
    }, []);

    const resetSearch = async () => {
        setSearch("");
        await fetchData({ search: INIT_PARAMS.search, page: INIT_PARAMS.page });
    }

    const handleOnChange = (ev) => {
        setUsers({ ...users, page: INIT_PARAMS.page })

        if (ev.target.value === "") {
            void resetSearch();
        }

        setSearch(ev.target.value);
    }

    const onChangePage = (newPage) => void fetchData({ search: search, page: newPage });

    useDebounce(search, 300, fetchData, { search: search, page: users.page });

    if (loading) return <Loading/>;

    return (
        <PageTitle title="Hall of Fame" subtitle="This is the showcase of profiles ranked by profile level">
            <div className="mt-2 md:w-[900px] mx-auto w-full">
                <div className="flex justify-start items-center mt-5 mb-4">
                    <Input
                        value={search}
                        onChange={handleOnChange}
                        placeholder="Search by username"
                        className="rounded-md w-56"
                    />
                    {search &&
                        <Button className="ml-3" size="sm" onClick={resetSearch}>
                            Cancel
                        </Button>
                    }
                </div>
                {users.data.map(item =>
                    <HoFCard
                        key={item.username}
                        item={item}
                    />
                )}
                <Pagination
                    currentPage={users.page}
                    totalPages={users.totalPages}
                    onChangePage={onChangePage}
                />
            </div>
        </PageTitle>
    )
};
