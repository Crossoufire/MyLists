import {Link} from "@tanstack/react-router";
import {capitalize} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {MediaLevelCircle} from "@/components/app/MediaLevelCircle";
import {SearchComponent} from "@/components/media-list/SearchComponent";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {LuArrowUpDown, LuAward, LuFilter, LuGrid, LuLineChart, LuList, LuUser} from "react-icons/lu";
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";


export const Header = (props) => {
    const { isGrid, userData, pagination, onGridClick, onFilterClick, onStatusChange, onSortChange, onSearchEnter } = props;
    const { username, mediaType } = Route.useParams();
    const { sorting, all_status: allStatus, all_sorting: allSorting } = pagination;

    return (
        <div className="flex flex-wrap items-center justify-between mt-8 mb-6 gap-6">
            <h3 className="flex items-center gap-3 text-3xl font-medium truncate max-sm:text-xl">
                <MediaLevelCircle intLevel={parseInt(userData.settings[mediaType].level)}/>
                {`${username} ${capitalize(mediaType)} Collection`}
            </h3>
            <div className="flex flex-wrap gap-3">
                <SearchComponent
                    onSearchEnter={onSearchEnter}
                />
                <StatusComponent
                    allStatus={allStatus}
                    onStatusChange={onStatusChange}
                />
                <Button variant="filters" onClick={onFilterClick}>
                    <LuFilter className="w-4 h-4"/> Filters
                </Button>
                <SortComponent
                    sorting={sorting}
                    allSorting={allSorting}
                    applySorting={onSortChange}
                />
                <div className="flex items-center gap-3">
                    <Button variant="filters" onClick={onGridClick}>
                        {isGrid ? <LuList className="w-4 h-4"/> : <LuGrid className="w-4 h-4"/>}
                    </Button>
                </div>
                <DotsOthers/>
            </div>
        </div>
    );
};


const StatusComponent = ({ allStatus, onStatusChange }) => {
    const search = Route.useSearch();

    const handleStatusChange = (status) => {
        onStatusChange({ status: [...(search.status || []), status] });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="filters">
                    <LuList className="w-4 h-4"/> Status
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {allStatus.map(st =>
                    <DropdownMenuCheckboxItem
                        key={st}
                        onSelect={() => handleStatusChange(st)}
                        checked={search.status ? search.status.includes(st) : []}
                    >
                        {st}
                    </DropdownMenuCheckboxItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


const SortComponent = ({ sorting, allSorting, applySorting }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="filters">
                    <LuArrowUpDown className="w-4 h-4"/> Sort
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={sorting} onValueChange={applySorting}>
                    {allSorting.map(sort =>
                        <DropdownMenuRadioItem key={sort} value={sort}>
                            {sort}
                        </DropdownMenuRadioItem>
                    )}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


const DotsOthers = () => {
    const { mediaType, username } = Route.useParams();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="filters" className="px-2">
                    <DotsVerticalIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-46 py-1 px-1 text-sm">
                <Button variant="list" asChild>
                    <Link to={`/profile/${username}`}>
                        <LuUser className="mr-2"/> User's profile
                    </Link>
                </Button>
                <Button variant="list" asChild>
                    <Link to={`/stats/${mediaType}/${username}`}>
                        <LuLineChart className="mr-2"/> Collection Stats
                    </Link>
                </Button>
                <Button variant="list" asChild>
                    <Link to={`/achievements/${username}`}>
                        <LuAward className="mr-2"/> Achievements
                    </Link>
                </Button>
            </PopoverContent>
        </Popover>
    );
};