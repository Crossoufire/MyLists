import {toast} from "sonner";
import {FaCaretUp} from "react-icons/fa";
import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useDebounce} from "@/hooks/DebouceHook";
import {HoFCard} from "@/components/hof/HoFCard";
import {PageTitle} from "@/components/app/PageTitle";
import {Pagination} from "@/components/primitives/Pagination";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";


const INIT_PARAMS = { search: "", page: 1, sorting: "profile" };

export const HallOfFamePage = () => {
    const api = useApi();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(INIT_PARAMS.search);
    const [sorting, setSorting] = useState(INIT_PARAMS.sorting);
    const [users, setUsers] = useState({ data: [], page: INIT_PARAMS.page, totalPages: 0 });

    const fetchData = async (params) => {
        setLoading(true);
        const response = await api.get("/hall_of_fame", params);
        setLoading(false);

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        setUsers({
            data: response.body.data.users,
            page: response.body.data.page,
            totalPages: response.body.data.pages,
        });
    };

    useEffect(() => {
        (async () => {
            await fetchData(INIT_PARAMS);
        })();
    }, []);

    const resetSearch = async () => {
        setSearch("");

        await fetchData({
            ...INIT_PARAMS,
            sorting: sorting,
        });
    }

    const onSearchChange = (ev) => {
        const newValue = ev.target.value;

        setUsers({
            ...users,
            page: INIT_PARAMS.page,
        })

        if (newValue === "") {
            void resetSearch();
        }

        setSearch(newValue);
    }

    const onChangePage = (newPage) => {
        void fetchData({
            search: search,
            page: newPage,
            sorting: sorting,
        });

        window.scrollTo({top: 0, behavior: "smooth"});
    }

    const onSortClicked = (sorting) => {
        setSorting(sorting);
        setSearch("");
        void fetchData({ ...INIT_PARAMS, sorting: sorting });
    }

    useDebounce(search, 300, fetchData, {
        search: search,
        page: users.page,
        sorting: sorting
    });

    return (
        <PageTitle title="Hall of Fame" subtitle="This is the showcase of profiles ranked by profile level">
            <div className="mt-2 md:w-[900px] mx-auto w-full">
                <div className="flex justify-start items-center mt-2 mb-4">
                    <Input
                        value={search}
                        onChange={onSearchChange}
                        placeholder="Search by username"
                        className="rounded-md w-56"
                    />
                    {search && <Button className="ml-3" size="sm" onClick={resetSearch}>Cancel</Button>}
                </div>
                <div className="mt-5 mb-5 bg-cyan-950 rounded-md p-2">
                    <div className="font-medium text-neutral-300">Sort levels by</div>
                    <Tabs value={sorting} onValueChange={onSortClicked} className="mt-1">
                        <TabsList className="grid grid-cols-6 max-sm:grid-cols-3 h-full">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="series">Series</TabsTrigger>
                            <TabsTrigger value="anime">Anime</TabsTrigger>
                            <TabsTrigger value="movies">Movies</TabsTrigger>
                            <TabsTrigger value="books">Books</TabsTrigger>
                            <TabsTrigger value="games">Games</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                {loading ?
                    <>
                        {Array.from({length: 10}).map(_ =>
                            <HoFCard.Skeleton/>
                        )}
                    </>
                    :
                    users.data.map(item =>
                        <HoFCard
                            key={item.username}
                            item={item}
                        />
                    )
                }
                <Pagination
                    currentPage={users.page}
                    totalPages={users.totalPages}
                    onChangePage={onChangePage}
                />
            </div>
        </PageTitle>
    )
};


const SortButton = ({children, sorting, callback }) => {
    const type = children.toString().toLowerCase();

    return (
        <Button variant={sorting === type ? "default" : "secondary"} onClick={() => callback(type)}>
            {children} {sorting === type && <>&nbsp;<FaCaretUp/></>}
        </Button>
    );
};