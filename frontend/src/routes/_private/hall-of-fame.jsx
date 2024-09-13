import {useState} from "react";
import {LuSearch} from "react-icons/lu";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {capitalize, cn} from "@/utils/functions";
import {hallOfFameOptions} from "@/api/queryOptions";
import {Card, CardContent} from "@/components/ui/card";
import {Pagination} from "@/components/app/Pagination";
import {useSuspenseQuery} from "@tanstack/react-query";
import {useDebounceCallback} from "@/hooks/DebounceHook";
import {MutedText} from "@/components/app/base/MutedText";
import {PageTitle} from "@/components/app/base/PageTitle";
import {MediaLevelCircle} from "@/components/app/base/MediaLevelCircle";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/hall-of-fame")({
    component: HallOfFamePage,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(hallOfFameOptions(search));
    },
});


const DEFAULT = { page: 1, search: "", sorting: "profile" };


function HallOfFamePage() {
    const navigate = useNavigate();
    const filters = Route.useSearch();
    const apiData = useSuspenseQuery(hallOfFameOptions(filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const { sorting = DEFAULT.sorting, page = DEFAULT.page, search = DEFAULT.search } = filters;

    const fetchData = async (params) => {
        // noinspection JSCheckFunctionSignatures
        await navigate({ search: params });
    };

    const resetSearch = async () => {
        setCurrentSearch(DEFAULT.search);
        await fetchData((prev) => ({ ...prev, search: DEFAULT.search }));
    };

    const onPageChange = async (newPage) => {
        await fetchData({ search, page: newPage, sorting });
    };

    const onSortChanged = async (sorting) => {
        await fetchData({ search, page: 1, sorting });
    };

    useDebounceCallback(currentSearch, 400, fetchData, { search: currentSearch, page: DEFAULT.page, sorting });

    return (
        <PageTitle title="Hall of Fame" subtitle="This is the showcase of profiles ranked by profile level">
            <div className="mt-2 md:w-[900px] mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-start mt-2 mb-4">
                        <div className="relative w-60">
                            <Input
                                value={currentSearch}
                                placeholder="Search by username"
                                className="pl-10 rounded-md w-56"
                                onChange={(ev) => setCurrentSearch(ev.target.value)}
                            />
                            <LuSearch
                                size={18}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300"
                            />
                        </div>
                        {search && <Button size="sm" onClick={resetSearch}>Cancel</Button>}
                    </div>
                    <div>
                        <Select value={sorting} onValueChange={onSortChanged} disabled={apiData.items.length === 0}>
                            <SelectTrigger className="w-40 pr-0">
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
                {apiData.items.length === 0 ?
                    <MutedText>No users found</MutedText>
                    :
                    apiData.items.map(user =>
                        <HoFCard
                            user={user}
                            key={user.username}
                        />
                    )}
                <Pagination
                    currentPage={page}
                    totalPages={apiData.pages}
                    onChangePage={onPageChange}
                />
            </div>
        </PageTitle>
    );
}


const HoFCard = ({ user }) => {
    const { currentUser } = useAuth();
    const { series, anime, movies, books, games } = user.settings;
    const settings = [series, anime, movies, books, games];

    return (
        <Card key={user.username} className={cn("p-2 mb-5 bg-card", currentUser.id === user.id && "bg-teal-950")}>
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
    );
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
