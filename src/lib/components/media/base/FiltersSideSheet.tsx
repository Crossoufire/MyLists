import React, {useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Input} from "@/lib/components/ui/input";
import {Badge} from "@/lib/components/ui/badge";
import {Button} from "@/lib/components/ui/button";
import {useDebounce} from "@/lib/hooks/use-debounce";
import {Checkbox} from "@/lib/components/ui/checkbox";
import {Separator} from "@/lib/components/ui/separator";
import {mediaConfig} from "@/lib/components/media-config";
import {useParams, useSearch} from "@tanstack/react-router";
import {MutedText} from "@/lib/components/general/MutedText";
import {useOnClickOutside} from "@/lib/hooks/use-clicked-outside";
import {GamesPlatformsEnum, JobType, Status} from "@/lib/server/utils/enums";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Command, CommandEmpty, CommandItem, CommandList} from "@/lib/components/ui/command";
import {ChevronDown, ChevronUp, CircleHelp, LoaderCircle, MoveRight, Search, X} from "lucide-react";
import {filterSearchOptions, listFiltersOptions} from "@/lib/react-query/query-options/query-options";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/lib/components/ui/sheet";
import {statusUtils} from "@/lib/utils/functions";
import {MediaListArgs} from "@/lib/types/zod.schema.types";


interface FiltersSideSheetProps {
    isCurrent: boolean;
    onClose: () => void;
    onFilterApply: (filters: Partial<MediaListArgs>) => void;
}


export const FiltersSideSheet = ({ isCurrent, onClose, onFilterApply }: FiltersSideSheetProps) => {
    const search = useSearch({ from: "/_private/list/$mediaType/$username" });
    const { username, mediaType } = useParams({ from: "/_private/list/$mediaType/$username" });
    const { data: listFilters, isPending } = useQuery(listFiltersOptions(mediaType, username));

    const localFilters: Partial<MediaListArgs> = {};
    const allStatuses = statusUtils.byMediaType(mediaType);
    const activeFiltersConfig = mediaConfig[mediaType].sheetFilters();

    const handleRegisterChange = (filterType: keyof MediaListArgs, value: string[] | boolean) => {
        const updatedFilters = { ...localFilters };

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

        Object.assign(localFilters, updatedFilters);
    };

    const handleOnSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
        onClose();
        ev.preventDefault();
        onFilterApply(localFilters);
    };

    return (
        <Sheet defaultOpen={true} onOpenChange={onClose}>
            <SheetContent className="max-sm:w-full overflow-y-auto" side="right">
                <SheetHeader>
                    <SheetTitle className="-mb-2">Additional Filters</SheetTitle>
                    <SheetDescription className="flex items-center gap-1">
                        How filters works <FilterInfoPopover/>
                    </SheetDescription>
                </SheetHeader>
                <Separator/>
                <form onSubmit={handleOnSubmit}>
                    {isPending ?
                        <div className="flex items-center justify-center h-[70vh]">
                            <LoaderCircle className="size-10 animate-spin"/>
                        </div>
                        :
                        <div>
                            <CheckboxGroup
                                title="Status"
                                items={allStatuses.map(s => ({ name: s }))}
                                onChange={(status) => handleRegisterChange("status", [status])}
                                defaultChecked={(status) => search?.status?.includes(status as Status) ?? false}
                            />
                            <Separator/>
                            <CheckboxGroup
                                title="Genres"
                                items={listFilters?.genres ?? []}
                                onChange={(genre) => handleRegisterChange("genres", [genre])}
                                defaultChecked={(genre) => search.genres?.includes(genre) ?? false}
                            />
                            <Separator/>

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
                                            <Separator/>
                                        </React.Fragment>
                                    );
                                }
                                if (filter.type === "search") {
                                    return (
                                        <React.Fragment key={filter.key}>
                                            <SearchFilter
                                                job={filter.job!}
                                                title={filter.title}
                                                filterKey={filter.key}
                                                dataList={(search as any)?.[filter.key] ?? []}
                                                registerChange={(key, val) => handleRegisterChange(key, val)}
                                            />
                                            <Separator/>
                                        </React.Fragment>
                                    );
                                }
                                return null;
                            })}

                            <Separator/>
                            <div className="space-y-2">
                                <h3 className="font-medium">Miscellaneous</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="favoriteCheck"
                                            defaultChecked={search.favorite}
                                            onCheckedChange={() => handleRegisterChange("favorite", !search.favorite)}
                                        />
                                        <label htmlFor="favoriteCheck" className="text-sm cursor-pointer">Favorites</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="commentCheck"
                                            defaultChecked={search.comment}
                                            onCheckedChange={() => handleRegisterChange("comment", !search.comment)}
                                        />
                                        <label htmlFor="commentCheck" className="text-sm cursor-pointer">Comments</label>
                                    </div>
                                    {!isCurrent &&
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="commonCheck"
                                                defaultChecked={search?.hideCommon ?? false}
                                                onCheckedChange={() => handleRegisterChange("hideCommon", search?.hideCommon ?? false)}
                                            />
                                            <label htmlFor="commonCheck" className="text-sm cursor-pointer">Hide Common</label>
                                        </div>
                                    }
                                </div>
                            </div>
                            <Separator/>
                            <CheckboxGroup
                                title="Labels"
                                items={listFilters?.labels ?? []}
                                onChange={(label) => handleRegisterChange("labels", [label])}
                                defaultChecked={(label) => search.labels?.includes(label) ?? false}
                            />
                            <Separator/>
                            <Button type="submit" className="w-full">
                                Apply Filters
                            </Button>
                        </div>
                    }
                </form>
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
                    <MutedText>Nothing to display.</MutedText>
                    :
                    visibleItems.map(item =>
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
                <Button variant="ghost" size="sm" onClick={toggleShowAll} className="w-full mt-2">
                    {showAll ?
                        <>Show Less <ChevronUp className="size-5"/></>
                        :
                        <>Show More <ChevronDown className="size-5"/></>
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
        <PopoverContent className="w-full space-y-2" align="start">
            <div className="-mt-2 font-medium underline underline-offset-2">
                Examples
            </div>
            <div>
                Drama + Crime
                <br/>
                <MoveRight className="w-4 h-4 inline-block"/>&nbsp;
                <br/>
                (Drama <b>OR</b> Crime)
            </div>
            <div>
                Drama + Crime + France
                <br/>
                <MoveRight className="w-4 h-4 inline-block"/>&nbsp;
                <br/>
                (Drama <b>OR</b> Crime) <b>AND</b> France
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

    const { mediaType, username } = useParams({ from: "/_private/list/$mediaType/$username" });
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
                        className={"w-[280px] pl-8"}
                        onChange={handleInputChange}
                        placeholder={`Search ${job} in this collection`}
                    />
                </div>
                {isOpen && (debouncedSearch.length >= 2 || isLoading) &&
                    <div className="z-50 absolute w-[280px] rounded-lg border shadow-md mt-1">
                        <Command>
                            <CommandList className="max-h-[300px] overflow-y-auto">
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
