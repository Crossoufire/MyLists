import {Link} from "@tanstack/react-router";
import {capitalize} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import {MediaLevelCircle} from "@/components/app/MediaLevelCircle";
import {SearchComponent} from "@/components/media-list/SearchComponent";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {ArrowUpDown, Award, ChartLine, EllipsisVertical, Filter, Grid2X2, List, User} from "lucide-react";
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";


export const Header = (props) => {
    const { isGrid, userData, pagination, onGridClick, onFilterClick, onStatusChange, onSortChange, onSearchEnter } = props;
    const { username, mediaType } = Route.useParams();
    const { sorting, all_status: allStatus, all_sorting: allSorting } = pagination;

    return (
        <div className="flex flex-wrap items-center justify-between mt-8 mb-6 gap-6">
            <h3 className="flex items-center text-3xl font-medium truncate max-sm:text-xl">
                <MediaLevelCircle
                    mediaType={mediaType}
                    className={"text-2xl max-sm:text-xl"}
                    containerClassName={"pt-1"}
                    intLevel={parseInt(userData.settings.find(s => s.media_type === mediaType).level)}
                />
                &nbsp;- {`${username} ${capitalize(mediaType)} Collection`}
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
                    <Filter className="w-4 h-4"/> Filters
                </Button>
                <SortComponent
                    sorting={sorting}
                    allSorting={allSorting}
                    applySorting={onSortChange}
                />
                <div className="flex items-center gap-3">
                    <Button variant="filters" onClick={onGridClick}>
                        {isGrid ? <List className="w-4 h-4"/> : <Grid2X2 className="w-4 h-4"/>}
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
                    <List className="w-4 h-4"/> Status
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
                    <ArrowUpDown className="w-4 h-4"/> Sort
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
                    <EllipsisVertical className="w-4 h-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-46 py-1 px-1 text-sm">
                <Button variant="list" asChild>
                    <Link to={`/profile/${username}`}>
                        <User className="mr-2 w-4 h-4"/> User's profile
                    </Link>
                </Button>
                <Button variant="list" asChild>
                    <Link to={`/stats/${username}?mt=${mediaType}`}>
                        <ChartLine className="mr-2 w-4 h-4"/> Collection Stats
                    </Link>
                </Button>
                <Button variant="list" asChild>
                    <Link to={`/achievements/${username}`}>
                        <Award className="mr-2 w-4 h-4"/> Achievements
                    </Link>
                </Button>
            </PopoverContent>
        </Popover>
    );
};