import React, {useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {statusUtils} from "@/lib/utils/functions";
import {Input} from "@/lib/client/components/ui/input";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {MediaListArgs} from "@/lib/types/zod.schema.types";
import {useParams, useSearch} from "@tanstack/react-router";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {Checkbox} from "@/lib/client/components/ui/checkbox";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {GamesPlatformsEnum, JobType, Status} from "@/lib/utils/enums";
import {mediaConfig} from "@/lib/client/components/media/media-config";
import {useOnClickOutside} from "@/lib/client/hooks/use-clicked-outside";
import {ChevronDown, ChevronUp, CircleHelp, LoaderCircle, Search, X} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {Command, CommandEmpty, CommandItem, CommandList} from "@/lib/client/components/ui/command";
import {filterSearchOptions, listFiltersOptions} from "@/lib/client/react-query/query-options/query-options";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle} from "@/lib/client/components/ui/sheet";


interface FiltersSideSheetProps {
    isCurrent: boolean;
    onClose: () => void;
    onFilterApply: (filters: Partial<MediaListArgs>) => void;
}


export const FiltersSideSheet = ({ isCurrent, onClose, onFilterApply }: FiltersSideSheetProps) => {
    const localFiltersRef = useRef<Partial<MediaListArgs>>({});
    const search = useSearch({ from: "/_main/_private/list/$mediaType/$username" });
    const { username, mediaType } = useParams({ from: "/_main/_private/list/$mediaType/$username" });
    const { data: listFilters, isPending } = useQuery(listFiltersOptions(mediaType, username));

    const allStatuses = statusUtils.byMediaType(mediaType);
    const activeFiltersConfig = mediaConfig[mediaType].sheetFilters();

    const handleRegisterChange = (filterType: keyof MediaListArgs, value: string[] | boolean) => {
        const updatedFilters = { ...localFiltersRef.current };

        if (Array.isArray(value)) {
            const prev = updatedFilters[filterType] as string[] | undefined;
            let newArr: string[];
            if (prev) {
                newArr = [...prev];
                value.forEach((val) => {
                    if (newArr.includes(val)) {
                        newArr = newArr.filter((item) => item !== val);
                    }
                    else {
                        newArr.push(val);
                    }
                });
            }
            else {
                newArr = value;
            }
            if (newArr.length === 0) {
                delete updatedFilters[filterType];
            }
            else {
                updatedFilters[filterType] = newArr as any;
            }
        }
        else {
            updatedFilters[filterType] = value as any;
        }

        localFiltersRef.current = updatedFilters;
    };

    const handleOnSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
        onClose();
        ev.preventDefault();
        onFilterApply(localFiltersRef.current);
    };

    return (
        <Sheet defaultOpen={true} onOpenChange={onClose}>
            <SheetContent className="max-sm:w-full" side="right">
                <SheetHeader>
                    <SheetTitle>Additional Filters</SheetTitle>
                    <SheetDescription className="flex items-center gap-2">
                        How filters works <FilterInfoPopover/>
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    <form id="filters-form" onSubmit={handleOnSubmit}>
                        {isPending ?
                            <div className="flex items-center justify-center h-[70vh]">
                                <LoaderCircle className="size-10 animate-spin"/>
                            </div>
                            :
                            <div className="pl-4 space-y-6">
                                {/*<CheckboxGroup*/}
                                {/*    title="Status"*/}
                                {/*    items={allStatuses.map(s => ({ name: s }))}*/}
                                {/*    onChange={(status) => handleRegisterChange("status", [status])}*/}
                                {/*    defaultChecked={(status) => search?.status?.includes(status as Status) ?? false}*/}
                                {/*/>*/}
                                <CheckboxGroup
                                    title="Genres"
                                    items={listFilters?.genres ?? []}
                                    onChange={(genre) => handleRegisterChange("genres", [genre])}
                                    defaultChecked={(genre) => search.genres?.includes(genre) ?? false}
                                />
                                {activeFiltersConfig.map((filter) => {
                                    if (filter.type === "checkbox" && filter.getItems) {
                                        const items = filter.getItems(listFilters || {} as any);
                                        if (!items || items.length === 0) return null;
                                        return (
                                            <React.Fragment key={filter.key}>
                                                <CheckboxGroup
                                                    items={items}
                                                    title={filter.title}
                                                    onChange={(val) => handleRegisterChange(filter.key, [val])}
                                                    defaultChecked={(val) => (search as any)?.[filter.key]?.includes(val) ?? false}
                                                    renderLabel={(name) => filter.renderLabel ? filter.renderLabel(name, mediaType) : name}
                                                />
                                            </React.Fragment>
                                        );
                                    }
                                    if (filter.type === "search") {
                                        return (
                                            <div key={filter.key} className="mb-4">
                                                <SearchFilter
                                                    job={filter.job!}
                                                    title={filter.title}
                                                    filterKey={filter.key}
                                                    dataList={(search as any)?.[filter.key] ?? []}
                                                    registerChange={(key, val) => handleRegisterChange(key, val)}
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                <div className="space-y-2">
                                    <h3 className="font-medium">
                                        Miscellaneous
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="favoriteCheck"
                                                defaultChecked={search.favorite}
                                                onCheckedChange={(checked) => handleRegisterChange("favorite", !!checked)}
                                            />
                                            <label htmlFor="favoriteCheck" className="text-sm cursor-pointer">
                                                Favorites
                                            </label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="commentCheck"
                                                defaultChecked={search.comment}
                                                onCheckedChange={(checked) => handleRegisterChange("comment", !!checked)}
                                            />
                                            <label htmlFor="commentCheck" className="text-sm cursor-pointer">
                                                Comments
                                            </label>
                                        </div>
                                        {!isCurrent &&
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="commonCheck"
                                                    defaultChecked={search?.hideCommon ?? false}
                                                    onCheckedChange={(checked) => handleRegisterChange("hideCommon", !!checked)}
                                                />
                                                <label htmlFor="commonCheck" className="text-sm cursor-pointer">
                                                    Hide Common
                                                </label>
                                            </div>
                                        }
                                    </div>
                                </div>
                                <CheckboxGroup
                                    title="Labels"
                                    items={listFilters?.labels ?? []}
                                    defaultChecked={(label) => search.labels?.includes(label) ?? false}
                                    onChange={(label) => handleRegisterChange("labels", [label])}
                                />
                            </div>
                        }
                    </form>
                </div>
                <SheetFooter>
                    <Button type="submit" form="filters-form" className="w-full">
                        Apply Filters
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};


interface CheckboxGroupProps {
    title: string;
    renderLabel?: (name: string) => string;
    items: { name: string }[] | { name: GamesPlatformsEnum }[];
    onChange: (v: string | Status | GamesPlatformsEnum) => void;
    defaultChecked: (v: string | Status | GamesPlatformsEnum) => boolean;
}


const CheckboxGroup = ({ title, items, onChange, defaultChecked, renderLabel }: CheckboxGroupProps) => {
    const initVisibleItems = 14;
    const [showAll, setShowAll] = useState(false);
    const visibleItems = showAll ? items : items.slice(0, initVisibleItems);

    const toggleShowAll = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        setShowAll(!showAll);
    };

    return (
        <div className="space-y-2">
            <h3 className="font-medium">
                {title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
                {visibleItems.length === 0 ?
                    <MutedText className="text-sm">Nothing to display</MutedText>
                    :
                    visibleItems.map((item) =>
                        <div key={item.name} className="flex items-center space-x-2">
                            <Checkbox
                                id={item.name + "-id"}
                                defaultChecked={defaultChecked?.(item.name)}
                                onCheckedChange={() => onChange(item.name)}
                            />
                            <label htmlFor={item.name + "-id"} className="text-sm cursor-pointer line-clamp-1">
                                {renderLabel ? renderLabel(item.name) : item.name}
                            </label>
                        </div>
                    )
                }
            </div>
            {items.length > initVisibleItems &&
                <Button variant="outline" size="xs" onClick={toggleShowAll} className="mt-1">
                    {showAll ?
                        <>Less <ChevronUp className="size-3.5"/></>
                        :
                        <>More <ChevronDown className="size-3.5"/></>
                    }
                </Button>
            }
        </div>
    );
};


const FilterInfoPopover = () => (
    <Popover>
        <PopoverTrigger>
            <CircleHelp className="w-4 h-4"/>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-3">
                <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="size-2 rounded-full bg-gray-400 mt-1.5 shrink-0"/>
                        <div>
                            <span className="font-medium text-cyan-500">
                                Same category filters:{" "}
                            </span>
                            Results include media matching <i>any</i> selected filter.
                            <div>(Filter A <strong>OR</strong> Filter B)</div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="size-2 rounded-full bg-gray-400 mt-1.5 shrink-0"/>
                        <div>
                            <span className="font-medium text-amber-500">
                                Different category filters:{" "}
                            </span>
                            Results include media matching <i>all</i> selected filters.
                            <div>(Filter A <strong>AND</strong> Filter B)</div>
                        </div>
                    </div>
                </div>
            </div>
        </PopoverContent>
    </Popover>
);


interface SearchFilterProps {
    job: JobType;
    title: string;
    dataList: string[];
    filterKey: keyof MediaListArgs;
    registerChange: (filterType: keyof MediaListArgs, value: string[]) => void;
}


const SearchFilter = ({ filterKey, job, title, dataList, registerChange }: SearchFilterProps) => {
    const commandRef = useRef(null);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 300);
    const [selectedData, setSelectedData] = useState(dataList ?? []);

    const { mediaType, username } = useParams({ from: "/_main/_private/list/$mediaType/$username" });
    const { data: filterResults, isLoading, error } = useQuery(filterSearchOptions(mediaType, username, debouncedSearch, job));

    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setIsOpen(true);
        setSearch(ev.target.value);
    };

    const resetSearch = () => {
        setSearch("");
        setIsOpen(false);
    };

    const handleAddClicked = (data: string) => {
        resetSearch();
        if (selectedData.includes(data)) return;
        registerChange(filterKey, [data]);
        setSelectedData([...selectedData, data]);
    };

    const handleRemoveData = (data: string) => {
        registerChange(filterKey, [data]);
        setSelectedData(selectedData.filter((d) => d !== data));
    };

    useOnClickOutside(commandRef, resetSearch);

    return (
        <div>
            <h3 className="font-medium">{title}</h3>
            <div ref={commandRef} className="mt-1 w-56 relative">
                <div className="relative">
                    <Search size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        value={search}
                        className="w-70 pl-8"
                        onChange={handleInputChange}
                        placeholder={`Search ${title.toLowerCase()}...`}
                    />
                </div>
                {isOpen && (debouncedSearch.length >= 2 || isLoading) &&
                    <div className="z-50 absolute w-70 rounded-lg border shadow-md mt-1">
                        <Command>
                            <CommandList className="max-h-75 overflow-y-auto">
                                {isLoading &&
                                    <div className="flex items-center justify-center p-4">
                                        <LoaderCircle className="h-6 w-6 animate-spin"/>
                                    </div>
                                }
                                {error &&
                                    <CommandEmpty>
                                        An error occurred. Please try again.
                                    </CommandEmpty>
                                }
                                {filterResults && filterResults.length === 0 &&
                                    <CommandEmpty>
                                        No results found.
                                    </CommandEmpty>
                                }
                                {filterResults && filterResults.length > 0 &&
                                    filterResults.map((item, idx) =>
                                        <div key={idx} role="button" onClick={() => handleAddClicked(item.name!)}>
                                            <CommandItem>{item.name}</CommandItem>
                                        </div>
                                    )
                                }
                            </CommandList>
                        </Command>
                    </div>
                }
            </div>
            <div className="flex flex-wrap gap-2">
                {selectedData.map(item =>
                    <Badge key={item} className="mt-2 bg-neutral-800 h-8 px-4 text-sm gap-2" variant="outline">
                        {item}
                        <div role="button" className="hover:opacity-80 -mr-1" onClick={() => handleRemoveData(item)}>
                            <X className="h-4 w-4"/>
                        </div>
                    </Badge>
                )}
            </div>
        </div>
    );
};
