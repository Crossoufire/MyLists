import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/formating";
import {Link, useSearch} from "@tanstack/react-router";
import {SearchType} from "@/lib/types/zod.schema.types";
import {Button} from "@/lib/client/components/ui/button";
import {MediaLevel} from "@/lib/client/components/general/MediaLevel";
import {SearchInput} from "@/lib/client/components/general/SearchInput";
import {useSearchNavigate} from "@/lib/client/hooks/use-search-navigate";
import {ListPagination, ListUserData} from "@/lib/types/query.options.types";
import {ArrowUpDown, Award, ChartLine, EllipsisVertical, Filter, Grid2X2, List, User} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/lib/client/components/ui/dropdown-menu";


interface HeaderProps {
    isGrid: boolean;
    username: string;
    mediaType: MediaType;
    userData: ListUserData;
    onGridClick: () => void;
    onFilterClick: () => void;
    pagination: ListPagination;
    onSortChange: ({ sort }: { sort: string }) => void;
}


export const Header = (props: HeaderProps) => {
    const { search } = useSearch({ strict: false });
    const { localSearch, handleInputChange } = useSearchNavigate<SearchType>({ search: search ?? "" });
    const { username, mediaType, isGrid, userData, pagination, onGridClick, onFilterClick, onSortChange } = props;
    const timeSpent = userData?.userMediaSettings.find((s) => s.mediaType === mediaType)?.timeSpent ?? 0;

    return (
        <div className="flex flex-wrap items-center justify-between mt-8 mb-6 gap-6">
            <h3 className="flex items-center text-3xl font-medium truncate max-sm:text-xl">
                <MediaLevel
                    mediaType={mediaType}
                    timeSpentMin={timeSpent}
                    containerClassName="pt-1"
                    className="text-2xl max-sm:text-xl"
                />
                &nbsp;- {`${username} ${capitalize(mediaType)} Collection`}
            </h3>
            <div className="flex flex-wrap gap-3">
                <SearchInput
                    className="w-62"
                    value={localSearch}
                    placeholder="Search Name..."
                    onChange={handleInputChange}
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
                <DotsOthers
                    username={username}
                    mediaType={mediaType}
                />
            </div>
        </div>
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


const DotsOthers = ({ mediaType, username, }: { mediaType: MediaType; username: string }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <EllipsisVertical className="size-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                    <Link to="/profile/$username" params={{ username }}>
                        <User className="size-4 text-muted-foreground"/>
                        <span>User's Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/stats/$username" params={{ username }} search={{ mediaType }}>
                        <ChartLine className="size-4 text-muted-foreground"/>
                        <span>Collection Stats</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/achievements/$username" params={{ username }}>
                        <Award className="size-4 text-muted-foreground"/>
                        <span>Achievements</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
