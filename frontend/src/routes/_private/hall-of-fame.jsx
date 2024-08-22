import {useState} from "react";
import {FaTimes} from "react-icons/fa";
import {capitalize, cn} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {fetcher} from "@/lib/fetcherLoader";
import {userClient} from "@/api/MyApiClient";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Pagination} from "@/components/app/Pagination";
import {PageTitle} from "@/components/app/base/PageTitle";
import {MediaLevelCircle} from "@/components/app/base/MediaLevelCircle";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/hall-of-fame")({
    component: HallOfFamePage,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ deps }) => fetcher("/general/hall-of-fame", deps.search),
});


const DEFAULT = { page: 1, search: "", sorting: "profile" };


function HallOfFamePage() {
    const navigate = useNavigate();
    const apiData = Route.useLoaderData();
    const { sorting = DEFAULT.sorting, page = DEFAULT.page, search = DEFAULT.search } = Route.useSearch();
    const [currentSearch, setCurrentSearch] = useState(search);

    const fetchData = async (params) => {
        // noinspection JSCheckFunctionSignatures
        await navigate({ search: params });
    };

    const resetFilters = async () => {
        setCurrentSearch(DEFAULT.search);
        await fetchData(DEFAULT);
    };

    const onPageChange = async(newPage) => {
        await fetchData({ search, page: newPage, sorting });
    };

    const onSearchEnter = async (ev) => {
        const newSearch = ev.target.value;
        if (ev.key !== "Enter" || newSearch.length < 1) {
            return;
        }
        await fetchData({ search: newSearch, page: 1, sorting });
    };

    const onSortingChanged = async (sorting) => {
        await fetchData({ search,  page: 1, sorting });
    };

    return (
        <PageTitle title="Hall of Fame" subtitle="This is the showcase of profiles ranked by level">
            <div className="mt-2 md:w-[850px] mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-start mt-2 mb-4">
                        <Input
                            value={currentSearch}
                            onKeyUp={onSearchEnter}
                            className={"rounded-md w-56"}
                            placeholder={"Search by username"}
                            onChange={(ev) => setCurrentSearch(ev.target.value)}
                        />
                        {currentSearch &&
                            <Button variant="ghost" size="icon" className="ml-3" onClick={resetFilters}>
                                <FaTimes/>
                            </Button>
                        }
                    </div>
                    <div>
                        <Select value={sorting} onValueChange={onSortingChanged} disabled={apiData.data.length === 0}>
                            <SelectTrigger className="w-[130px]">
                                <div className="font-medium">
                                    Rank by &nbsp;&#8226;&nbsp; {capitalize(sorting)}
                                </div>
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
                {apiData.data.length === 0 ?
                    <div className="italic text-muted-foreground text-center mt-6">
                        No users found
                    </div>
                    :
                    apiData.data.map(item =>
                        <HoFCard
                            item={item}
                            key={item.user.username}
                        />
                    )}
                <Pagination
                    currentPage={page}
                    onChangePage={onPageChange}
                    totalPages={apiData.pagination.pages}
                />
            </div>
        </PageTitle>
    );
}


const HoFCard = ({ item }) => {
    return (
        <Card key={item.user.username} className={cn("p-2 mb-5 bg-card",
            userClient.currentUser.id === item.user.id && "bg-teal-950")}>
            <CardContent className="max-sm:py-5 p-0">
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 md:col-span-1">
                        <div className="flex items-center justify-center text-lg h-full font-medium">
                            #{item.rank}
                        </div>
                    </div>
                    <div className="col-span-9 md:col-span-4">
                        <div className="relative">
                            <img
                                src={item.user.profile_cover}
                                className="z-10 absolute top-[53px] left-[46px] rounded-full h-[70px] w-[70px]"
                                alt="profile-image"
                            />
                            <img
                                src={item.user.profile_border}
                                className="w-[162px] h-[162px]"
                                alt="frame-image"
                            />
                            <Badge variant="passive" className="z-20 absolute bottom-[17px] left-[59px]">
                                {item.user.profile_level}
                            </Badge>
                            <h6 className="block absolute font-medium left-[165px] bottom-[58px] text-center">
                                <Link to={`/profile/${item.user.username}`} className="hover:underline hover:underline-offset-2">
                                    {item.user.username}
                                </Link>
                            </h6>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-7">
                        <div className="grid grid-cols-5 text-center items-center font-medium h-full">
                            {item.user.settings.map(setting =>
                                <ListItem
                                    setting={setting}
                                    key={setting.media_type}
                                    username={item.user.username}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


const ListItem = ({ setting, username }) => {
    return (
        <div className="flex flex-col justify-evenly items-center gap-2">
            <div>{capitalize(setting.media_type)}</div>
            <Link to={`/list/${setting.media_type}/${username}`} disabled={!setting.active}>
                <MediaLevelCircle
                    intLevel={setting.level}
                    isActive={setting.active}
                    className="w-[40px] h-[40px]"
                />
            </Link>
        </div>
    );
};
