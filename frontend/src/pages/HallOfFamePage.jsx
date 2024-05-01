import {toast} from "sonner";
import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {capitalize, cn} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useUser} from "@/providers/UserProvider";
import {useDebounce} from "@/hooks/DebounceHook";
import {Skeleton} from "@/components/ui/skeleton";
import {PageTitle} from "@/components/app/PageTitle";
import {Card, CardContent} from "@/components/ui/card";
import {Pagination} from "@/components/app/Pagination.jsx";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/components/ui/select";


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
    };

    const onSearchChange = (ev) => {
        const newValue = ev.target.value;

        setUsers({
            ...users,
            page: INIT_PARAMS.page,
        });

        if (newValue === "") {
            void resetSearch();
        }

        setSearch(newValue);
    };

    const onChangePage = (newPage) => {
        void fetchData({
            search: search,
            page: newPage,
            sorting: sorting,
        });

        window.scrollTo({top: 0, behavior: "smooth"});
    };

    const onSortClicked = (sorting) => {
        setSorting(sorting);
        setSearch("");
        void fetchData({ ...INIT_PARAMS, sorting: sorting });
    };

    useDebounce(search, 300, fetchData, {
        search: search,
        page: users.page,
        sorting: sorting
    });

    return (
        <PageTitle title="Hall of Fame" subtitle="This is the showcase of profiles ranked by profile level">
            <div className="mt-2 md:w-[900px] mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-start mt-2 mb-4">
                        <Input
                            value={search}
                            onChange={onSearchChange}
                            placeholder="Search by username"
                            className="rounded-md w-56"
                        />
                        {search && <Button className="ml-3" size="sm" onClick={resetSearch}>Cancel</Button>}
                    </div>
                    <div>
                        <Select value={sorting} onValueChange={onSortClicked} disabled={loading}>
                            <SelectTrigger className="w-[130px]">
                                <div className="font-medium">Rank by &nbsp;&#8226;&nbsp; {capitalize(sorting)}</div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="profile">Profile</SelectItem>
                                <SelectItem value="series">Series</SelectItem>
                                <SelectItem value="anime">Anime</SelectItem>
                                <SelectItem value="movies">Movies</SelectItem>
                                <SelectItem value="books">Books</SelectItem>
                                <SelectItem value="games">Games</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {loading ?
                    <>{Array.from({length: 10}).map((_, idx) => <HoFCard.Skeleton key={idx}/>)}</>
                    :
                    users.data.map(item => <HoFCard key={item.username} item={item}/>)
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


export const HoFCard = ({ item }) => {
    const { currentUser } = useUser();

    return (
        <Card key={item.username} className={cn("p-2 mb-5 bg-card", currentUser?.id === item.id && "bg-teal-950")}>
            <CardContent className="p-0">
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 md:col-span-1">
                        <div className="flex items-center justify-center text-lg h-full font-medium">
                            #{item.rank}
                        </div>
                    </div>
                    <div className="col-span-9 md:col-span-4">
                        <div className="relative">
                            <img
                                src={item.profile_image}
                                className="z-10 absolute top-[53px] left-[46px] rounded-full h-[70px] w-[70px]"
                                alt="profile-image"
                            />
                            <img
                                src={item.profile_border}
                                className="w-[162px] h-[162px]"
                                alt="frame-image"
                            />
                            <Badge variant="passive" className="z-20 absolute bottom-[17px] left-[59px]">
                                {item.profile_level}
                            </Badge>
                            <h6 className="block absolute font-medium left-[165px] bottom-[58px] text-center">
                                <Link to={`/profile/${item.username}`} className="hover:underline hover:underline-offset-2">
                                    {item.username}
                                </Link>
                            </h6>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-7">
                        <div className="grid grid-cols-5 text-center items-center font-medium h-full">
                            <ListItem item={item} mediaType="series"/>
                            <ListItem item={item} mediaType="anime"/>
                            <ListItem item={item} mediaType="movies"/>
                            <ListItem item={item} mediaType="books"/>
                            <ListItem item={item} mediaType="games"/>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
};


const ListItem = ({ item, mediaType }) => {
    const checkDisabled = item.hasOwnProperty(`add_${mediaType}`) ? item[`add_${mediaType}`] === true : true;

    return (
        <div className="flex flex-col justify-evenly items-center h-full">
            <div>{capitalize(mediaType)}</div>
            {checkDisabled ?
                <Link to={`/list/${mediaType}/${item.username}`}>
                    <div className="mb-1"><img src={item[`${mediaType}_image`]} alt={`${mediaType}-grade`} /></div>
                    <div>{item[`${mediaType}_level`]}</div>
                </Link>
                :
                <div className="flex content-center items-center h-[68px]">Disabled</div>
            }
        </div>
    );
};


HoFCard.Skeleton = function SkeletonHoFCard() {
    return <Skeleton className="p-2 mb-5 md:h-[178px] h-[282px]"/>;
};
