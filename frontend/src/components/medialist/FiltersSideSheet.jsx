import {useRef, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import * as Com from "@/components/ui/command";
import * as Pop from "@/components/ui/popover";
import {useQuery} from "@tanstack/react-query";
import * as Sheet from "@/components/ui/sheet";
import {useDebounce} from "@/hooks/DebounceHook";
import {Checkbox} from "@/components/ui/checkbox";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/app/base/Loading";
import {LuLoader2, LuSearch, LuX} from "react-icons/lu";
import {useOnClickOutside} from "@/hooks/ClickedOutsideHook";
import {capitalize, getLangCountryName} from "@/utils/functions.jsx";
import {Route} from "@/routes/_private/list/$mediaType.$username";
import {FaArrowRightLong, FaCaretDown, FaCaretUp, FaCircleQuestion} from "react-icons/fa6";
import {queryOptionsMap} from "@/api/queryOptions.js";


export const FiltersSideSheet = ({ isCurrent, onClose, allStatus, onFilterApply }) => {
    let localFilters = {};
    const search = Route.useSearch();
    const {username, mediaType} = Route.useParams();
    const searchFiltersList = getListSearchFilters(mediaType);
    const {data: smallFilters, isLoading} = useQuery(queryOptionsMap.smallFilters(mediaType, username));

    const registerChange = (filterType, value) => {
        if (Array.isArray(value)) {
            const updatedSearch = {...localFilters};
            if (Array.isArray(localFilters[filterType])) {
                value.forEach(val => {
                    if (localFilters[filterType].includes(val)) {
                        updatedSearch[filterType] = [...localFilters[filterType].filter(item => item !== val)];
                        if (updatedSearch[filterType].length === 0) {
                            delete updatedSearch[filterType];
                        }
                    } else {
                        updatedSearch[filterType] = [...localFilters[filterType], val];
                    }
                });
            }
            else {
                updatedSearch[filterType] = value;
            }
            localFilters = {...updatedSearch,};
        } else {
            localFilters = {...localFilters, [filterType]: value};
        }
    };

    const handleOnSubmit = async (ev) => {
        ev.preventDefault();
        await onFilterApply(localFilters);
    };

    return (
        <Sheet.Sheet defaultOpen={true} onOpenChange={onClose}>
            <Sheet.SheetContent className="max-sm:w-full">
                <Sheet.SheetHeader>
                    <Sheet.SheetTitle>Additional Filters</Sheet.SheetTitle>
                    <Sheet.SheetDescription>
                        <div className="flex items-center space-x-2">
                            How filters works &nbsp;
                            <FilterInfoPopover/>
                        </div>
                    </Sheet.SheetDescription>
                </Sheet.SheetHeader>
                <Separator/>
                <form onSubmit={handleOnSubmit}>
                    {isLoading ?
                        <div className="flex items-center justify-center h-[85vh]">
                            <Loading/>
                        </div>
                        :
                        <div className="mt-3 mb-6 space-y-4">
                            <CheckboxGroup
                                title="Status"
                                items={allStatus}
                                onChange={(status) => registerChange("status", [status])}
                                defaultChecked={(status) => search.status?.includes(status)}
                            />
                            {smallFilters.platforms.length > 0 &&
                                <>
                                    <Separator/>
                                    <CheckboxGroup
                                        title="Platforms"
                                        items={smallFilters.platforms}
                                        onChange={(plat) => registerChange("platforms", [plat])}
                                        defaultChecked={(plat) => search.platforms?.includes(plat)}
                                    />
                                </>
                            }
                            <Separator/>
                            {searchFiltersList.map(job =>
                                <SearchFilter
                                    key={job}
                                    job={job}
                                    dataList={search[job]}
                                    registerChange={registerChange}
                                />
                            )}
                            <Separator/>
                            <CheckboxGroup
                                title="Genres"
                                items={smallFilters.genres ?? []}
                                onChange={(genre) => registerChange("genres", [genre])}
                                defaultChecked={(genre) => search.genres?.includes(genre)}
                            />
                            <Separator/>
                            {smallFilters.langs.length > 0 &&
                                <>
                                    <div className="space-y-2">
                                        <h3 className="font-medium">Languages/Countries</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {smallFilters.langs.map(lang =>
                                                <div key={lang} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`${lang}-id`}
                                                        defaultChecked={search.langs?.includes(lang)}
                                                        onCheckedChange={() => registerChange("langs", [lang])}
                                                    />
                                                    <label htmlFor={`${lang}-id`}
                                                           className="text-sm cursor-pointer line-clamp-1">
                                                        {(mediaType === "series" || mediaType === "anime") ?
                                                            getLangCountryName(lang, "region")
                                                            :
                                                            getLangCountryName(lang, "language")
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
                                            onCheckedChange={() => registerChange("favorite", !search.favorite)}
                                        />
                                        <label htmlFor="favoriteCheck"
                                               className="text-sm cursor-pointer">Favorites</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="commentCheck"
                                            defaultChecked={search.comment}
                                            onCheckedChange={() => registerChange("comment", !search.comment)}
                                        />
                                        <label htmlFor="commentCheck"
                                               className="text-sm cursor-pointer">Comments</label>
                                    </div>
                                    {!isCurrent &&
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="commonCheck"
                                                defaultChecked={search.common}
                                                onCheckedChange={() => registerChange("common", !search.common)}
                                            />
                                            <label htmlFor="commonCheck" className="text-sm cursor-pointer">Hide Common</label>
                                        </div>
                                    }
                                </div>
                            </div>
                            <Separator/>
                            {smallFilters.labels.length > 0 &&
                                <>
                                    <CheckboxGroup
                                        title="Labels"
                                        items={smallFilters.labels ?? []}
                                        onChange={(label) => registerChange("labels", [label])}
                                        defaultChecked={(label) => search.labels?.includes(label)}
                                    />
                                    <Separator/>
                                </>
                            }
                            <Sheet.SheetFooter className="pr-2">
                                <Sheet.SheetClose asChild className="w-full">
                                    <Button type="submit">Apply Filters</Button>
                                </Sheet.SheetClose>
                            </Sheet.SheetFooter>
                        </div>
                    }
                </form>
            </Sheet.SheetContent>
        </Sheet.Sheet>
    );
};


function getListSearchFilters(mediaType) {
    const mapping = {
        "series": ["actors", "creators", "networks"],
        "anime": ["actors", "creators", "networks"],
        "movies": ["actors", "directors"],
        "books": ["authors"],
        "games": ["companies"],
    };
    return mapping[mediaType];
}


const CheckboxGroup = ({ title, items, onChange, defaultChecked }) => {
    const initVisibleItems = 14;
    const [showAll, setShowAll] = useState(false);
    const visibleItems = showAll ? items : items.slice(0, initVisibleItems);

    const toggleShowAll = (ev) => {
        ev.preventDefault();
        setShowAll(!showAll);
    };

    return (
        <div className="space-y-2">
            <h3 className="font-medium">{title}</h3>
            <div className="grid grid-cols-2 gap-2">
                {visibleItems.map(item => (
                    <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                            id={`${item}-id`}
                            defaultChecked={defaultChecked?.(item)}
                            onCheckedChange={() => onChange(item)}
                        />
                        <label htmlFor={`${item}-id`} className="text-sm cursor-pointer line-clamp-1">{item}</label>
                    </div>
                ))}
            </div>
            {items.length > initVisibleItems &&
                <Button variant="ghost" size="sm" onClick={toggleShowAll} className="w-full mt-2">
                    {showAll ? <>Show Less <FaCaretUp className="h-4 w-4"/></> :
                        <>Show More <FaCaretDown className="h-4 w-4"/></>}
                </Button>
            }
        </div>
    );
};


const SearchFilter = ({ job, dataList, registerChange }) => {
    const commandRef = useRef(null);
    const {mediaType, username} = Route.useParams();
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedSearch] = useDebounce(search, 300);
    const [selectedData, setSelectedData] = useState(dataList ?? []);
    const {data, isLoading, error} = useQuery(queryOptionsMap.filterSearch(mediaType, username, debouncedSearch, job));

    const handleInputChange = (ev) => {
        setIsOpen(true);
        setSearch(ev.target.value);
    };

    const resetSearch = () => {
        setSearch("");
        setIsOpen(false);
    };

    useOnClickOutside(commandRef, resetSearch);

    const handleAddClicked = (data) => {
        resetSearch();
        if (selectedData.includes(data)) return;
        registerChange(job, [data]);
        setSelectedData([...selectedData, data]);
    };

    const handleRemoveData = (data) => {
        registerChange(job, [data]);
        setSelectedData(selectedData.filter(d => d !== data));
    };

    return (
        <div>
            <h3 className="font-medium">{capitalize(job)}</h3>
            <div ref={commandRef} className="mt-1 w-56 relative">
                <div className="relative">
                    <LuSearch size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        value={search}
                        className="w-[280px] pl-8"
                        onChange={handleInputChange}
                        placeholder={`Search ${job} in this collection`}
                    />
                </div>
                {isOpen && (debouncedSearch.length >= 2 || isLoading) &&
                    <div className="z-50 absolute w-[280px] rounded-lg border shadow-md mt-1">
                        <Com.Command>
                            <Com.CommandList className="max-h-[300px] overflow-y-auto">
                                {isLoading &&
                                    <div className="flex items-center justify-center p-4">
                                        <LuLoader2 className="h-6 w-6 animate-spin"/>
                                    </div>
                                }
                                {error &&
                                    <Com.CommandEmpty>An error occurred. Please try again.</Com.CommandEmpty>
                                }
                                {data && data.length === 0 &&
                                    <Com.CommandEmpty>No results found.</Com.CommandEmpty>
                                }
                                {data && data.length > 0 &&
                                    data.map((result, idx) =>
                                        <div key={idx} role="button" onClick={() => handleAddClicked(result)}>
                                            <Com.CommandItem>{result}</Com.CommandItem>
                                        </div>
                                    )
                                }
                            </Com.CommandList>
                        </Com.Command>
                    </div>
                }
            </div>
            <div className="flex flex-wrap gap-2">
                {selectedData.map(item =>
                    <Badge key={item} className="mt-2 bg-neutral-800 h-8 px-4 text-sm gap-2" variant="outline">
                        {item}
                        <div role="button" className="hover:opacity-80 -mr-1" onClick={() => handleRemoveData(item)}>
                            <LuX/>
                        </div>
                    </Badge>
                )}
            </div>
        </div>
    );
};


const FilterInfoPopover = () => (
    <Pop.Popover>
        <Pop.PopoverTrigger>
            <FaCircleQuestion/>
        </Pop.PopoverTrigger>
        <Pop.PopoverContent className="w-full space-y-2" align="left">
            <div className="-mt-2 font-medium underline underline-offset-2">
                Examples
            </div>
            <div>
                Drama + Crime
                <br/>
                <FaArrowRightLong className="inline-block"/>&nbsp;
                <br/>
                (Drama <b>OR</b> Crime)
            </div>
            <div>
                Drama + Crime + France
                <br/>
                <FaArrowRightLong className="inline-block"/>&nbsp;
                <br/>
                (Drama <b>OR</b> Crime) <b>AND</b> France
            </div>
        </Pop.PopoverContent>
    </Pop.Popover>
);
