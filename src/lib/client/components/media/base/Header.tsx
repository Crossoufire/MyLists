import React from "react";
import {cn} from "@/lib/utils/helpers";
import {Status} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {ListPagination} from "@/lib/types/query.options.types";
import {MediaListArgs, SearchType} from "@/lib/types/zod.schema.types";
import {SearchInput} from "@/lib/client/components/general/SearchInput";
import {useSearchNavigate} from "@/lib/client/hooks/use-search-navigate";
import {ArrowUpDown, ChevronDown, Filter, Grid2X2, List, ListFilter} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/lib/client/components/ui/dropdown-menu";


interface HeaderProps {
    isGrid: boolean;
    allStatuses: Status[];
    filters: MediaListArgs;
    onGridClick: () => void;
    onFilterClick: () => void;
    pagination: ListPagination;
    onSortChange: ({ sort }: { sort: string }) => void;
    onSearchChange: ({ search }: { search: string }) => void;
    onStatusChange: ({ status }: { status: Status[] }) => void;
}


export const Header = (props: HeaderProps) => {
    const { allStatuses, filters, isGrid, onGridClick, onFilterClick, pagination, onSortChange, onStatusChange } = props;
    const { localSearch, handleInputChange } = useSearchNavigate<SearchType>({ search: filters.search ?? "" });

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="order-1 w-full md:order-2 md:flex-1 md:min-w-50">
                <SearchInput
                    value={localSearch}
                    onChange={handleInputChange}
                    placeholder={`Search in ${filters.status ?? "All Media"}...`}
                />
            </div>
            <div className="order-2 md:order-1">
                <StatusComponent
                    filters={filters}
                    allStatuses={allStatuses}
                    onStatusChange={({ status }) => onStatusChange({ status })}
                />
            </div>
            <div className="order-2 md:order-3 flex-1 md:flex-0">
                <Button
                    variant="outline"
                    onClick={onFilterClick}
                    title="Advanced Filters"
                    className="w-full md:w-auto"
                >
                    <Filter className="size-4"/> Filters
                </Button>
            </div>

            {/* 4. Sorting & Grid Toggle - Order 3 and Full Width on mobile */}
            <div className="order-3 flex w-full items-center gap-3 md:order-4 md:w-auto">
                <SortComponent
                    applySorting={onSortChange}
                    sorting={pagination.sorting}
                    allSorting={pagination.availableSorting}
                />

                <div className="ml-auto flex h-9 items-center rounded-md border bg-input/30 px-1 md:ml-0">
                    <button
                        onClick={onGridClick}
                        className={cn(
                            "p-1.5 rounded-sm transition-all",
                            isGrid
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Grid2X2 className="size-4"/>
                    </button>
                    <button
                        onClick={onGridClick}
                        className={cn(
                            "p-1.5 rounded-sm transition-all",
                            isGrid
                                ? "text-muted-foreground hover:text-foreground"
                                : "bg-background shadow-sm text-foreground",
                        )}
                    >
                        <List className="size-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


interface StatusComponentProps {
    allStatuses: Status[];
    filters: MediaListArgs;
    onStatusChange: ({ status }: { status: Status[] }) => void;
}


const StatusComponent = ({ filters, allStatuses, onStatusChange }: StatusComponentProps) => {
    const activeStatus = filters.status?.[0] ?? "All Media";
    const allStatusesWithAll = ["All Media", ...allStatuses];

    const handleStatusChange = (status: string) => {
        if (status === "All Media") {
            return onStatusChange({ status: [] });
        }
        onStatusChange({ status: [...(filters.status || []), status as Status] });
    };

    const checkIfChecked = (status: string) => {
        if (status === "All Media" && activeStatus === "All Media") return true;
        return filters.status ? filters.status.includes(status as Status) : false;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button variant="outline" className="w-full md:w-50 justify-between focus:ring-none focus:outline-none">
                    <span className="flex items-center gap-2 truncate">
                        <ListFilter className="size-4 text-muted-foreground"/>
                        <span>{activeStatus}</span>
                    </span>
                    <ChevronDown className="size-4 opacity-50"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-50">
                {allStatusesWithAll.map((s) =>
                    <DropdownMenuCheckboxItem
                        key={s}
                        checked={checkIfChecked(s)}
                        onSelect={() => handleStatusChange(s)}
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


export const SortComponent = ({ sorting, allSorting, applySorting }: SortComponentProps) => {
    const handleSortChange = (sort: string) => {
        applySorting({ sort });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-45 justify-between focus:ring-none focus:outline-none">
                    <span className="flex items-center gap-2 truncate">
                        <ArrowUpDown className="size-4 text-muted-foreground"/>
                        <span>{sorting}</span>
                    </span>
                    <ChevronDown className="size-4 opacity-50"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-45">
                <DropdownMenuRadioGroup value={sorting} onValueChange={handleSortChange}>
                    {allSorting.map((sort) =>
                        <DropdownMenuRadioItem key={sort} value={sort}>
                            {sort}
                        </DropdownMenuRadioItem>
                    )}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
