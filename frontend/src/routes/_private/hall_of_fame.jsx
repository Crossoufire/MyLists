import {toast} from "sonner";
import {useState} from "react";
import {capitalize, cn} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {fetcher} from "@/lib/fetcherLoader";
import {Button} from "@/components/ui/button";
import {useDebounce} from "@/hooks/DebounceHook";
import {api, userClient} from "@/api/MyApiClient";
import {Card, CardContent} from "@/components/ui/card";
import {Pagination} from "@/components/app/Pagination";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createFileRoute, Link} from "@tanstack/react-router";
import {MediaLevelCircle} from "@/components/app/base/MediaLevelCircle";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/hall_of_fame")({
    component: HallOfFamePage,
    loader: async () => fetcher("/hall_of_fame", INIT_PARAMS),
});


const INIT_PARAMS = { search: "", page: 1, sorting: "profile" };


function HallOfFamePage() {
    const data = Route.useLoaderData();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(INIT_PARAMS.search);
    const [sorting, setSorting] = useState(INIT_PARAMS.sorting);
    const [users, setUsers] = useState({
        data: data.users,
        page: INIT_PARAMS.page,
        totalPages: data.pages,
    });

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

    const resetSearch = async () => {
        setSearch("");
        await fetchData({ ...INIT_PARAMS, sorting });
    };

    const onSearchChange = (ev) => {
        const newValue = ev.target.value;
        setUsers({ ...users, page: INIT_PARAMS.page });
        if (newValue === "") {
            void resetSearch();
        }
        setSearch(newValue);
    };

    const onChangePage = (newPage) => {
        void fetchData({ search, page: newPage, sorting });
        window.scrollTo({top: 0, behavior: "smooth"});
    };

    const onSortClicked = (sorting) => {
        setSorting(sorting);
        setSearch("");
        void fetchData({ ...INIT_PARAMS, sorting: sorting });
    };

    useDebounce(search, 300, fetchData, { search, page: users.page, sorting });

    return (
        <PageTitle title="Hall of Fame" subtitle="This is the showcase of profiles ranked by profile level">
            <div className="mt-2 md:w-[900px] mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-start mt-2 mb-4">
                        <Input
                            value={search}
                            onChange={onSearchChange}
                            className="rounded-md w-56"
                            placeholder="Search by username"
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
                {users.data.map(user =>
                    <HoFCard key={user.username} user={user}/>
                )}
                <Pagination
                    currentPage={users.page}
                    totalPages={users.totalPages}
                    onChangePage={onChangePage}
                />
            </div>
        </PageTitle>
    )
}


const HoFCard = ({ user }) => {
    const currentUser = userClient.currentUser;
    const { series, anime, movies, books, games } = user.settings;
    const settings = [series, anime, movies, books, games];


    return (
        <Card key={user.username} className={cn("p-2 mb-5 bg-card", currentUser?.id === user.id && "bg-teal-950")}>
            <CardContent className="max-sm:py-5 p-0">
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 md:col-span-1">
                        <div className="flex items-center justify-center text-lg h-full font-medium">
                            #{user.rank}
                        </div>
                    </div>
                    <div className="col-span-9 md:col-span-4">
                        <div className="relative">
                            <img
                                src={user.profile_image}
                                className="z-10 absolute top-[53px] left-[46px] rounded-full h-[70px] w-[70px]"
                                alt="profile-image"
                            />
                            <img
                                src={user.profile_border}
                                className="w-[162px] h-[162px]"
                                alt="frame-image"
                            />
                            <Badge variant="passive" className="z-20 absolute bottom-[17px] left-[59px]">
                                {user.profile_level}
                            </Badge>
                            <h6 className="block absolute font-medium left-[165px] bottom-[58px] text-center">
                                <Link to={`/profile/${user.username}`} className="hover:underline hover:underline-offset-2">
                                    {user.username}
                                </Link>
                            </h6>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-7">
                        <div className="grid grid-cols-5 text-center items-center font-medium h-full">
                            {settings.map(setting =>
                                <ListItem
                                    setting={setting}
                                    key={setting.media_type}
                                    username={user.username}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
};


const ListItem = ({ setting, username }) => {
    return (
        <div className="flex flex-col justify-evenly items-center gap-2">
            <div>{capitalize(setting.media_type)}</div>
            <Link to={`/list/${setting.media_type}/${username}`} disabled={!setting.active}>
                <MediaLevelCircle
                    isActive={setting.active}
                    className={"w-[40px] h-[40px]"}
                    intLevel={parseInt(setting.level)}
                />
            </Link>
        </div>
    );
};
