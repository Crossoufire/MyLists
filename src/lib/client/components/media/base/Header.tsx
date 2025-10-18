import {Status} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {Link, useParams, useSearch} from "@tanstack/react-router";
import {MediaLevelCircle} from "@/lib/client/components/general/MediaLevelCircle";
import {capitalize, computeLevel, statusUtils} from "@/lib/utils/functions";
import {SearchComponent} from "@/lib/client/components/media/base/SearchComponent";
import {ListPagination, ListUserData} from "@/lib/types/query.options.types";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {ArrowUpDown, Award, ChartLine, EllipsisVertical, Filter, Grid2X2, List, User} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/lib/client/components/ui/dropdown-menu";
import React from "react";


interface HeaderProps {
    isGrid: boolean;
    userData: ListUserData;
    onGridClick: () => void;
    onFilterClick: () => void;
    pagination: ListPagination;
    onSortChange: ({ sort }: { sort: string }) => void;
    onSearchEnter: ({ search }: { search: string }) => void;
    onStatusChange: ({ status }: { status: Status[] }) => void;
}


export const Header = (props: HeaderProps) => {
    const { isGrid, userData, pagination, onGridClick, onFilterClick, onStatusChange, onSortChange, onSearchEnter } = props;
    const { username, mediaType } = useParams({ from: "/_main/_private/list/$mediaType/$username" });

    const allStatuses = statusUtils.byMediaType(mediaType);
    const userLevel = computeLevel(userData?.userMediaSettings.find(s => s.mediaType === mediaType)?.timeSpent ?? 0);

    return (
        <div className="flex flex-wrap items-center justify-between mt-8 mb-6 gap-6">
            <h3 className="flex items-center text-3xl font-medium truncate max-sm:text-xl">
                <MediaLevelCircle
                    mediaType={mediaType}
                    containerClassName="pt-1"
                    intLevel={Math.floor(userLevel)}
                    className="text-2xl max-sm:text-xl"
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
                <Button variant="outline" onClick={onFilterClick}>
                    <Filter className="size-4"/> Filters
                </Button>
                <SortComponent
                    applySorting={onSortChange}
                    sorting={pagination.sorting}
                    allSorting={pagination.availableSorting}
                />
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onGridClick} title="Toggle grid view">
                        {isGrid ? <><List className="size-4"/> List</> : <><Grid2X2 className="size-4"/> Grid</>}
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
    const search = useSearch({ from: "/_main/_private/list/$mediaType/$username" });

    const handleStatusChange = (status: Status) => {
        onStatusChange({ status: [...(search.status || []), status] });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <List className="size-4"/> Status
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
                <Button variant="outline">
                    <ArrowUpDown className="size-4"/> Sort
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
    const { mediaType, username } = useParams({ from: "/_main/_private/list/$mediaType/$username" });

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                    <EllipsisVertical className="size-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-42 p-2">
                <Link to="/profile/$username" params={{ username }}>
                    <Button variant="ghost" className="w-full inline-flex items-center justify-start">
                        <User className="size-4 text-muted-foreground"/> User's Profile
                    </Button>
                </Link>
                <Link to="/stats/$username" params={{ username }} search={{ mediaType }}>
                    <Button variant="ghost" className="w-full inline-flex items-center justify-start">
                        <ChartLine className="size-4 text-muted-foreground"/> Collection Stats
                    </Button>
                </Link>
                <Link to="/achievements/$username" params={{ username }}>
                    <Button variant="ghost" className="w-full inline-flex items-center justify-start">
                        <Award className="size-4 text-muted-foreground"/> Achievements
                    </Button>
                </Link>
            </PopoverContent>
        </Popover>
    );
};
