import {useState} from "react";
import {LuSearch} from "react-icons/lu";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
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
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


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
        <PageTitle title="Hall of Fame" subtitle="Showcase of profiles ranked by profile level">
            <div className="mt-2 md:w-[750px] mx-auto w-full">
                <div className="flex items-center justify-between gap-4 mt-4 mb-4">
                    <div className="flex items-center justify-start gap-3">
                        <div className="relative">
                            <Input
                                value={currentSearch}
                                className="pl-10 rounded-md"
                                placeholder="Search by username"
                                onChange={(ev) => setCurrentSearch(ev.target.value)}
                            />
                            <LuSearch
                                size={18}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                            />
                        </div>
                        {search && <Button size="sm" onClick={resetSearch}>Cancel</Button>}
                    </div>
                    <div>
                        <Select value={sorting} onValueChange={onSortChanged} disabled={apiData.items.length === 0}>
                            <SelectTrigger className="w-[120px] font-medium bg-outline border">
                                <SelectValue/>
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
                <div className="grid grid-cols-12 max-md:gap-8 py-4">
                    <div className="col-span-3 md:col-span-1">
                        <div className="flex items-center justify-center text-xl h-full font-medium">
                            #{user.rank}
                        </div>
                    </div>
                    <div className="col-span-9 md:col-span-4">
                        <div className="flex items-center gap-6">
                            <img
                                alt="profile-picture"
                                src={user.profile_image}
                                className="rounded-full h-[75px] w-[75px] border-2 border-amber-600"
                            />
                            <div className="space-y-2">
                                <h3 className="text-xl font-medium">
                                    <Link to={`/profile/${user.username}`} className="hover:underline hover:underline-offset-2">
                                        {user.username}
                                    </Link>
                                </h3>
                                <div className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r
                                from-blue-600 to-violet-600">
                                    Lvl {user.profile_level}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-7 max-md:col-span-12">
                        <div className="flex justify-center items-center font-medium h-full gap-8 max-md:gap-6">
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
            <Link to={`/list/${setting.media_type}/${username}`} disabled={!setting.active}>
                <MediaLevelCircle
                    isActive={setting.active}
                    className={"w-[35px] h-[35px]"}
                    intLevel={parseInt(setting.level)}
                />
            </Link>
            <div>{capitalize(setting.media_type)}</div>
        </div>
    );
};
