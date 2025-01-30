import {useState} from "react";
import {Search} from "lucide-react";
import {hallOfFameOptions} from "@/api";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {PageTitle} from "@/components/app/PageTitle";
import {MutedText} from "@/components/app/MutedText";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Card, CardContent} from "@/components/ui/card";
import {Pagination} from "@/components/app/Pagination";
import {useDebounceCallback} from "@/hooks/useDebounce";
import {HoFCard} from "@/components/hall-of-fame/HoFCard";
import {capitalize, getMediaColor} from "@/utils/functions";
import {createLazyFileRoute, useNavigate} from "@tanstack/react-router";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/hall-of-fame")({
    component: HallOfFamePage,
});


const DEFAULT = { page: 1, search: "", sorting: "normalized" };


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
            <div className="grid grid-cols-12 mx-auto w-[1000px] gap-x-10 max-sm:w-full max-sm:grid-cols-1">
                <div className="col-span-7 max-sm:col-span-1 w-full max-sm:mt-4 max-sm:order-2">
                    <div className="flex items-center justify-between mt-5 mb-3">
                        <div className="flex items-center justify-start gap-3">
                            <div className="relative">
                                <Input
                                    value={currentSearch}
                                    className="pl-10 rounded-md w-[180px]"
                                    placeholder="Search by username"
                                    onChange={(ev) => setCurrentSearch(ev.target.value)}
                                />
                                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"/>
                            </div>
                            {search && <Button size="sm" onClick={resetSearch}>Cancel</Button>}
                        </div>
                        <div>
                            <Select value={sorting} onValueChange={onSortChanged} disabled={apiData.items.length === 0}>
                                <SelectTrigger className="w-[130px] font-medium bg-outline border">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normalized">Normalized</SelectItem>
                                    <SelectItem value="profile">Profile</SelectItem>
                                    <SelectItem value="series">Series</SelectItem>
                                    <SelectItem value="anime">Anime</SelectItem>
                                    <SelectItem value="movies">Movies</SelectItem>
                                    <SelectItem value="books">Books</SelectItem>
                                    <SelectItem value="games">Games</SelectItem>
                                    <SelectItem value="manga">Manga</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {apiData.items.length === 0 ?
                        <MutedText>No users found.</MutedText>
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
                <div className="col-span-5 max-sm:col-span-1 mt-[28px] max-sm:mt-4 max-sm:order-1">
                    <div className="text-xl font-semibold mb-3">
                        My Rankings
                    </div>
                    <div className="grid grid-cols-2 w-full gap-3">
                        {apiData.user_ranks.map(rank =>
                            <Card key={rank.media_type} className="p-2 max-sm:py-0 bg-card">
                                <CardContent className="max-sm:py-4 p-2 space-y-1">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="font-semibold text-lg">{capitalize(rank.media_type)}</div>
                                        <div className="font-semibold text-xl"># {rank.rank}</div>
                                    </div>
                                    <Progress value={100 - rank.percent} max={100} className="mt-2" color={getMediaColor(rank.media_type)}/>
                                    <div className="text-xs font-semibold text-gray-400">
                                        Top {rank.percent.toFixed(1)}%
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </PageTitle>
    );
}
