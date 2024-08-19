import {capitalize, cn} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {fetcher} from "@/lib/fetcherLoader";
import {userClient} from "@/api/MyApiClient";
import {Card, CardContent} from "@/components/ui/card";
import {Pagination} from "@/components/app/Pagination";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/hall-of-fame")({
    component: HallOfFamePage,
    loaderDeps: ({ params }) => ({ params }),
    loader: async ({ deps }) => fetcher("/general/hall-of-fame", deps.params),
});


function HallOfFamePage() {
    const navigate = useNavigate();
    const apiData = Route.useLoaderData();
    const [search, setSearch] = useState(apiData.pagination.search);

    const sorting = apiData.pagination.sorting;
    const currentPage = apiData.pagination.page;
    const loaded_params = { search, page: currentPage, sorting };

    const fetchData = async (params) => {
        if (JSON.stringify(params) === JSON.stringify(loaded_params)) {
            return;
        }
        await navigate({ params });
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
            <div className="mt-2 md:w-[900px] mx-auto w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-start mt-2 mb-4">
                        <Input
                            value={search}
                            onKeyUp={onSearchEnter}
                            className={"rounded-md w-56"}
                            placeholder={"Search by username"}
                            onChange={(ev) => setSearch(ev.target.value)}
                        />
                    </div>
                    <div>
                        <Select value={sorting} onValueChange={onSortingChanged}>
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
                {apiData.data.map(item =>
                    <HoFCard key={item.user.username} item={item}/>)
                }
                <Pagination
                    currentPage={currentPage}
                    onChangePage={onPageChange}
                    totalPages={apiData.pagination.pages}
                />
            </div>
        </PageTitle>
    )
}


const HoFCard = ({ item }) => {
    const cU = userClient.currentUser;

    return (
        <Card key={item.user.username} className={cn("p-2 mb-5 bg-card", cU.id === item.user.id && "bg-teal-950")}>
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
                                src={item.user.profile_image}
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
                                    username={item.user.username}
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
        <div className="flex flex-col justify-evenly items-center h-full">
            <div>{capitalize(setting.media_type)}</div>
            {setting.active ?
                <Link to={`/list/${setting.media_type}/${username}`}>
                    <div className="mb-1">
                        {/* TODO: Recreate the CSS circle as in the profile page */}
                    </div>
                    <div>{setting.level}</div>
                </Link>
                :
                <div className="flex content-center items-center h-[68px]">Disabled</div>
            }
        </div>
    );
};
