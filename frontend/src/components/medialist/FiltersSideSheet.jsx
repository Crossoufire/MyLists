import {toast} from "sonner";
import {LuX} from "react-icons/lu";
import {api} from "@/api/MyApiClient";
import {useRef, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {fetcher} from "@/lib/fetcherLoader";
import {Button} from "@/components/ui/button";
import {useQuery} from "@tanstack/react-query";
import * as Pop from "@/components/ui/popover";
import * as Sheet from "@/components/ui/sheet";
import {useDebounce} from "@/hooks/DebounceHook";
import {Checkbox} from "@/components/ui/checkbox";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/app/base/Loading";
import {capitalize, getLangCountryName} from "@/lib/utils";
import {useOnClickOutside} from "@/hooks/ClickedOutsideHook";
import {Route} from "@/routes/_private/list/$mediaType.$username.jsx";
import {FaArrowRightLong, FaCaretDown, FaCaretUp, FaCircleQuestion} from "react-icons/fa6";

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


export const FiltersSideSheet = ({ isCurrent, onClose, allStatus, onFilterApply }) => {
    let localFilters = {};
    const search = Route.useSearch();
    const {username, mediaType} = Route.useParams();
    const searchFiltersList = getListSearchFilters(mediaType);
    const {data: smallFilters, isLoading} = useQuery({
        queryKey: ["smallFilters", mediaType, username],
        queryFn: () => fetcher(`/list/filters/${mediaType}/${username}`),
        staleTime: Infinity,
        retry: false,
    });

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
                                            {smallFilters.langs?.map(lang =>
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


const SearchFilter = ({job, dataList, registerChange}) => {
    const searchRef = useRef();
    const [results, setResults] = useState();
    const {mediaType, username} = Route.useParams();
    const [query, setQuery] = useState("");
    const [selectedData, setSelectedData] = useState(dataList ?? []);

    const handleSearchChange = (ev) => {
        if (query.length >= 2) {
            resetSearch();
        }
        setQuery(ev.target.value);
    };

    const resetSearch = () => {
        setQuery("");
        setResults(undefined);
    };

    const searchDB = async () => {
        if (!query || query.trim() === "" || query.length < 2) {
            return;
        }
        const response = await api.get(`/list/search/filters/${mediaType}/${username}`, {
            q: query,
            job: job,
        });
        if (!response.ok) {
            resetSearch();
            return toast.error(response.body.description);
        }
        setResults(response.body.data);
    };

    const handleAddClicked = (data) => {
        resetSearch();
        if (selectedData.includes(data)) {
            return;
        }
        registerChange(job, [data]);
        setSelectedData([...selectedData, data]);
    };

    const handleRemoveData = (data) => {
        registerChange(job, [data]);
        setSelectedData(selectedData.filter(d => d !== data));
    };

    useOnClickOutside(searchRef, resetSearch);
    useDebounce(query, 250, searchDB);

    return (
        <div>
            <h3 className="font-medium">{capitalize(job)}</h3>
            <div ref={searchRef} className="mt-1 w-56 relative">
                <Input
                    value={query}
                    onChange={handleSearchChange}
                    placeholder={`Search in this collection`}
                />
                <ShowSearch
                    query={query}
                    results={results}
                    handleAddClicked={handleAddClicked}
                />
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


const ShowSearch = ({ query, results, handleAddClicked }) => {
    if (query.length > 1 && results === undefined) {
        return (
            <div className="z-10 absolute h-[52px] w-56 top-11 bg-neutral-950 border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    <Loading/>
                </div>
            </div>
        );
    }
    if (!results) {
        return;
    }
    if (results.length === 0) {
        return (
            <div className="z-10 absolute h-[40px] w-56 top-11 bg-neutral-950 border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    Sorry, no matches found
                </div>
            </div>
        );
    }

    return (
        <div className="z-10 absolute max-h-[200px] w-56 top-11 bg-neutral-950 border rounded-md font-medium overflow-y-auto">
            {results.map(item =>
                <div key={item} role="button" className="flex p-1 items-center w-full hover:bg-neutral-900"
                     onClick={() => handleAddClicked(item)}>
                    <div>{item}</div>
                </div>
            )}
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
