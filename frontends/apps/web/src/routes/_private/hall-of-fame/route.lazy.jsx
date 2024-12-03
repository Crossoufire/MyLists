import {useState} from "react";
import {LuSearch} from "react-icons/lu";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {hallOfFameOptions} from "@mylists/api/queryOptions";
import {PageTitle} from "@/components/app/PageTitle";
import {MutedText} from "@/components/app/MutedText";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Pagination} from "@/components/app/Pagination";
import {useDebounceCallback} from "@/hooks/useDebounce";
import {HoFCard} from "@/components/hall-of-fame/HoFCard";
import {createLazyFileRoute, useNavigate} from "@tanstack/react-router";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/hall-of-fame")({
    component: HallOfFamePage,
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
