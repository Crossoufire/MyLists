import {Status} from "@/lib/server/utils/enums";
import {Button} from "@/lib/components/ui/button";
import {capitalize, computeLevel} from "@/lib/utils/functions";
import {mediaListOptions} from "@/lib/react-query/query-options";
import {Link, useParams, useSearch} from "@tanstack/react-router";
import {MediaLevelCircle} from "@/lib/components/app/MediaLevelCircle";
import {SearchComponent} from "@/lib/components/media-list/SearchComponent";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {ArrowUpDown, Award, ChartLine, EllipsisVertical, Filter, Grid2X2, List, User} from "lucide-react";
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from "@/lib/components/ui/dropdown-menu";


interface HeaderProps {
    isGrid: boolean;
    onGridClick: () => void;
    onFilterClick: () => void;
    onSortChange: ({ sort }: { sort: string }) => void;
    onSearchEnter: ({ search }: { search: string }) => void;
    onStatusChange: ({ status }: { status: Status[] }) => void;
    userData: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaListOptions>["queryFn"]>>>["userData"];
    pagination: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaListOptions>["queryFn"]>>>["results"]["pagination"];
}


export const Header = (props: HeaderProps) => {
    const { isGrid, userData, pagination, onGridClick, onFilterClick, onStatusChange, onSortChange, onSearchEnter } = props;
    const { username, mediaType } = useParams({ from: "/_private/list/$mediaType/$username" });
    const allStatuses = Status.byMediaType(mediaType);
    const userLevel = computeLevel(userData?.userMediaSettings.find(s => s.mediaType === mediaType)?.timeSpent ?? 0);

    return (
        <div className="flex flex-wrap items-center justify-between mt-8 mb-6 gap-6">
            <h3 className="flex items-center text-3xl font-medium truncate max-sm:text-xl">
                <MediaLevelCircle
                    mediaType={mediaType}
                    containerClassName={"pt-1"}
                    intLevel={Math.floor(userLevel)}
                    className={"text-2xl max-sm:text-xl"}
                />
                &nbsp;- {`${username} ${capitalize(mediaType)} Collection`}
            </h3>
            <div className="flex flex-wrap gap-3">
                <SearchComponent
                    onSearchEnter={onSearchEnter}
                />
                <StatusComponent
                    allStatuses={allStatuses}
                    onStatusChange={onStatusChange}
                />
                <Button onClick={onFilterClick}>
                    <Filter className="w-4 h-4"/> Filters
                </Button>
                <SortComponent
                    applySorting={onSortChange}
                    sorting={pagination.sorting}
                    allSorting={pagination.availableSorting}
                />
                <div className="flex items-center gap-3">
                    <Button onClick={onGridClick}>
                        {isGrid ? <List className="w-4 h-4"/> : <Grid2X2 className="w-4 h-4"/>}
                    </Button>
                </div>
                <DotsOthers/>
            </div>
        </div>
    );
};


interface StatusComponentProps {
    allStatuses: Status[];
    onStatusChange: ({ status }: { status: Status[] }) => void;
}


const StatusComponent = ({ allStatuses, onStatusChange }: StatusComponentProps) => {
    const search = useSearch({ from: "/_private/list/$mediaType/$username" });

    const handleStatusChange = (status: Status) => {
        onStatusChange({ status: [...(search.status || []), status] });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                    <List className="w-4 h-4"/> Status
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {allStatuses.map(s =>
                    <DropdownMenuCheckboxItem
                        key={s}
                        onSelect={() => handleStatusChange(s)}
                        checked={search.status ? search.status.includes(s) : false}
                    >
                        {s}
                    </DropdownMenuCheckboxItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


interface SortComponentProps {
    sorting: string,
    allSorting: string[],
    applySorting: ({ sort }: { sort: string }) => void,
}


const SortComponent = ({ sorting, allSorting, applySorting }: SortComponentProps) => {

    const handleSortChange = (sort: string) => {
        applySorting({ sort });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                    <ArrowUpDown className="w-4 h-4"/> Sort
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={sorting} onValueChange={handleSortChange}>
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
    const { mediaType, username } = useParams({ from: "/_private/list/$mediaType/$username" });

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button className="px-2">
                    <EllipsisVertical className="w-4 h-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-46 py-1 px-1 text-sm">
                <Button asChild>
                    <Link to="/profile/$username" params={{ username }}>
                        <User className="mr-2 w-4 h-4"/> User's profile
                    </Link>
                </Button>
                <Button asChild>
                    {/*// @ts-expect-error*/}
                    <Link to="/stats/$username" params={{ username }} search={{ mt: mediaType }}>
                        <ChartLine className="mr-2 w-4 h-4"/> Collection Stats
                    </Link>
                </Button>
                <Button asChild>
                    <Link to="/achievements/$username" params={{ username }}>
                        <Award className="mr-2 w-4 h-4"/> Achievements
                    </Link>
                </Button>
            </PopoverContent>
        </Popover>
    );
};
