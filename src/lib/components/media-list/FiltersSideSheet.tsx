import React, {useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Input} from "@/lib/components/ui/input";
import {Badge} from "@/lib/components/ui/badge";
import {Button} from "@/lib/components/ui/button";
import {useDebounce} from "@/lib/hooks/use-debounce";
import {Checkbox} from "@/lib/components/ui/checkbox";
import {Separator} from "@/lib/components/ui/separator";
import {useParams, useSearch} from "@tanstack/react-router";
import {useOnClickOutside} from "@/lib/hooks/use-clicked-outside";
import {capitalize, getLangCountryName} from "@/lib/utils/functions";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {GamesPlatformsEnum, JobType, MediaType, Status} from "@/lib/server/utils/enums";
import {Command, CommandEmpty, CommandItem, CommandList} from "@/lib/components/ui/command";
import {ChevronDown, ChevronUp, CircleHelp, LoaderCircle, MoveRight, Search, X} from "lucide-react";
import {filterSearchOptions, listFiltersOptions} from "@/lib/react-query/query-options/query-options";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/lib/components/ui/sheet";


interface FiltersSideSheetProps {
    isCurrent: boolean;
    onClose: () => void;
    onFilterApply: (filters: Record<string, any>) => void;
}


export const FiltersSideSheet = ({ isCurrent, onClose, onFilterApply }: FiltersSideSheetProps) => {
    let localFilters = {};
    const search = useSearch({ from: "/_private/list/$mediaType/$username" });
    const { username, mediaType } = useParams({ from: "/_private/list/$mediaType/$username" });
    const allStatuses = Status.byMediaType(mediaType);
    const searchFiltersList = JobType.byMediaType(mediaType);
    const { data: listFilters, isFetching } = useQuery(listFiltersOptions(mediaType, username));

    const handleRegisterChange = (filterType: string, value: any) => {
        if (Array.isArray(value)) {
            const updatedSearch = { ...localFilters };
            //@ts-expect-error
            if (Array.isArray(localFilters[filterType])) {
                value.forEach(val => {
                    //@ts-expect-error
                    if (localFilters[filterType].includes(val)) {
                        //@ts-expect-error
                        updatedSearch[filterType] = [...localFilters[filterType].filter(item => item !== val)];
                        //@ts-expect-error
                        if (updatedSearch[filterType].length === 0) {
                            //@ts-expect-error
                            delete updatedSearch[filterType];
                        }
                    }
                    else {
                        //@ts-expect-error
                        updatedSearch[filterType] = [...localFilters[filterType], val];
                    }
                });
            }
            else {
                //@ts-expect-error
                updatedSearch[filterType] = value;
            }
            localFilters = { ...updatedSearch, };
        }
        else {
            localFilters = { ...localFilters, [filterType]: value };
        }
    };

    const handleOnSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
        onClose();
        ev.preventDefault();
        onFilterApply(localFilters);
    };

    return (
        <Sheet defaultOpen={true} onOpenChange={onClose}>
            <SheetContent className="max-sm:w-full">
                <SheetHeader>
                    <SheetTitle className="-mb-2">Additional Filters</SheetTitle>
                    <SheetDescription className="flex items-center gap-1">
                        How filters works <FilterInfoPopover/>
                    </SheetDescription>
                </SheetHeader>
                <Separator/>
                <form onSubmit={handleOnSubmit}>
                    {isFetching ?
                        <div className="flex items-center justify-center h-[85vh]">
                            <LoaderCircle className="h-7 w-7 animate-spin"/>
                        </div>
                        :
                        <div className="">
                            <CheckboxGroup
                                title="Status"
                                items={allStatuses.map(s => ({ name: s }))}
                                onChange={(status) => handleRegisterChange("status", [status])}
                                defaultChecked={(status) => search?.status?.includes(status as Status)}
                            />
                            {listFilters && listFilters.platforms &&
                                <>
                                    <Separator/>
                                    <CheckboxGroup
                                        title="Platforms"
                                        items={listFilters.platforms}
                                        onChange={(pt) => handleRegisterChange("platforms", [pt])}
                                        defaultChecked={(pt) => search.platforms?.includes(pt as GamesPlatformsEnum)}
                                    />
                                </>
                            }
                            <Separator/>
                            {searchFiltersList.map(job =>
                                <SearchFilter
                                    key={job}
                                    job={job}
                                    //@ts-expect-error
                                    dataList={search[`${job}s`]}
                                    registerChange={handleRegisterChange}
                                />
                            )}
                            <Separator/>
                            <CheckboxGroup
                                title="Genres"
                                items={listFilters?.genres ?? []}
                                onChange={(genre) => handleRegisterChange("genres", [genre])}
                                defaultChecked={(genre: string) => search.genres?.includes(genre)}
                            />
                            <Separator/>
                            {listFilters && listFilters.langs &&
                                <>
                                    <div className="space-y-2">
                                        <h3 className="font-medium">Languages/Countries</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {listFilters.langs.map((lang: any) =>
                                                <div key={lang} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`${lang.name}-id`}
                                                        defaultChecked={search.langs?.includes(lang.name)}
                                                        onCheckedChange={() => handleRegisterChange("langs", [lang.name])}
                                                    />
                                                    <label htmlFor={`${lang.name}-id`} className="text-sm cursor-pointer line-clamp-1">
                                                        {(mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) ?
                                                            getLangCountryName(lang.name, "region")
                                                            :
                                                            getLangCountryName(lang.name, "language")
                                                        }
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Separator/>
                                </>
                            }
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
                                                defaultChecked={search.hideCommon}
                                                onCheckedChange={() => handleRegisterChange("common", search.hideCommon)}
                                            />
                                            <label htmlFor="commonCheck" className="text-sm cursor-pointer">
                                                Hide Common
                                            </label>
                                        </div>
                                    }
                                </div>
                            </div>
                            <Separator/>
                            {listFilters && listFilters.labels &&
                                <>
                                    <CheckboxGroup
                                        title="Labels"
                                        items={listFilters.labels}
                                        onChange={(label) => handleRegisterChange("labels", [label])}
                                        defaultChecked={(label) => search.labels?.includes(label)}
                                    />
                                    <Separator/>
                                </>
                            }
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
    defaultChecked: (v: string | Status | GamesPlatformsEnum) => void;
    onChange: (v: string | Status | GamesPlatformsEnum | null) => void;
    items: { name: string | number | null }[] | { name: GamesPlatformsEnum | null }[];
}


const CheckboxGroup = ({ title, items, onChange, defaultChecked }: CheckboxGroupProps) => {
    const initVisibleItems = 14;
    const [showAll, setShowAll] = useState(false);
    const visibleItems = showAll ? items : items.slice(0, initVisibleItems);

    const toggleShowAll = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        setShowAll(!showAll);
    };

    return (
        <div className="space-y-2">
            <h3 className="font-medium">{title}</h3>
            <div className="grid grid-cols-2 gap-2">
                {visibleItems.map(item =>
                    <div key={item.name} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${item}-id`}
                            //@ts-expect-error
                            defaultChecked={defaultChecked?.(`${item.name!}`)}
                            onCheckedChange={() => onChange(`${item.name!}`)}
                        />
                        <label htmlFor={`${item.name}-id`} className="text-sm cursor-pointer line-clamp-1">{item.name}</label>
                    </div>
                )}
            </div>
            {items.length > initVisibleItems &&
                <Button variant="ghost" size="sm" onClick={toggleShowAll} className="w-full mt-2">
                    {showAll ?
                        <>Show Less <ChevronUp className="ml-1" size={17}/></>
                        :
                        <>Show More <ChevronDown className="ml-1" size={17}/></>
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
    dataList: string[];
    registerChange: any;
}


const SearchFilter = ({ job, dataList, registerChange }: SearchFilterProps) => {
    const commandRef = useRef(null);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedSearch] = useDebounce(search, 300);
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
        registerChange(job, [data]);
        setSelectedData([...selectedData, data]);
    };

    const handleRemoveData = (data: string) => {
        registerChange(job, [data]);
        setSelectedData(selectedData.filter(d => d !== data));
    };

    useOnClickOutside(commandRef, resetSearch);

    return (
        <div>
            <h3 className="font-medium">{capitalize(job)}</h3>
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
                                {error && <CommandEmpty>An error occurred. Please try again.</CommandEmpty>}
                                {filterResults && filterResults.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
                                {filterResults && filterResults.length > 0 &&
                                    filterResults.map((item: any, idx: number) =>
                                        <div key={idx} role="button" onClick={() => handleAddClicked(item.name)}>
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
