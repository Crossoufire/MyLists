import {toast} from "sonner";
import {LuX} from "react-icons/lu";
import {api} from "@/api/MyApiClient";
import {useRef, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {fetcher} from "@/lib/fetcherLoader";
import {Button} from "@/components/ui/button";
import {useQuery} from "@tanstack/react-query";
import * as Sheet from "@/components/ui/sheet";
import * as Pop from "@/components/ui/popover";
import {useDebounce} from "@/hooks/DebounceHook";
import {Checkbox} from "@/components/ui/checkbox";
import {Loading} from "@/components/app/base/Loading";
import {capitalize, getLangCountryName} from "@/lib/utils";
import {useOnClickOutside} from "@/hooks/ClickedOutsideHook";
import {FaArrowRightLong, FaCircleQuestion} from "react-icons/fa6";
import {Route} from "@/routes/_private/list/$mediaType.$username.jsx";


function getListSearchFilters(mediaType) {
    const mapping = {
        "series": ["actors", "creators", "networks"],
        "anime": ["actors", "creators", "networks"],
        "movies": ["actors", "directors"],
        "books": ["authors"],
        "games": ["platforms", "companies"],
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
                        How filters works &nbsp;
                        <FilterInfoPopover/>
                    </Sheet.SheetDescription>
                </Sheet.SheetHeader>
                <form onSubmit={handleOnSubmit} className="overflow-auto max-h-[98%]">
                    {isLoading ?
                        <div className="flex items-center justify-center h-[85vh]">
                            <Loading/>
                        </div>
                        :
                        <div className="mt-3 mb-6 space-y-4">
                            {!isCurrent &&
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="commonCheck"
                                        defaultChecked={search.common}
                                        onCheckedChange={() => registerChange("common", !search.common)}
                                    />
                                    <label htmlFor="commonCheck" className="cursor-pointer">Hide Common</label>
                                </div>
                            }
                            <CheckboxGroup
                                title="Status"
                                items={allStatus}
                                onChange={(status) => registerChange("status", [status])}
                                defaultChecked={(status) => search.status?.includes(status)}
                            />
                            {searchFiltersList.map(job =>
                                <SearchFilter
                                    key={job}
                                    job={job}
                                    dataList={search[job]}
                                    registerChange={registerChange}
                                />
                            )}
                            <CheckboxGroup
                                title="Genres"
                                items={smallFilters.genres ?? []}
                                onChange={(genre) => registerChange("genres", [genre])}
                                defaultChecked={(genre) => search.genres?.includes(genre)}
                            />
                            {smallFilters.langs &&
                                <div>
                                    <h3 className="text-lg font-semibold">Languages/Countries</h3>
                                    <div className="grid grid-cols-2 max-h-[190px] max-w-[310px] overflow-auto">
                                        {smallFilters.langs?.map(lang =>
                                            <div key={lang} className="col-span-1 flex items-center gap-3">
                                                <Checkbox
                                                    id={`${lang}-id`}
                                                    defaultChecked={search.langs?.includes(lang)}
                                                    onCheckedChange={() => registerChange("langs", [lang])}
                                                />
                                                <label htmlFor={`${lang}-id`} className="cursor-pointer line-clamp-1">
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
                            }
                            <div>
                                <h3 className="text-lg font-semibold">Miscellaneous</h3>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="favoriteCheck"
                                        defaultChecked={search.favorite}
                                        onCheckedChange={() => registerChange("favorite", !search.favorite)}
                                    />
                                    <label htmlFor="favoriteCheck" className="cursor-pointer">Favorites</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="commentCheck"
                                        defaultChecked={search.comment}
                                        onCheckedChange={() => registerChange("comment", !search.comment)}
                                    />
                                    <label htmlFor="commentCheck" className="cursor-pointer">Comments</label>
                                </div>
                            </div>
                            <CheckboxGroup
                                title="Labels"
                                items={smallFilters.labels ?? []}
                                onChange={(label) => registerChange("labels", [label])}
                                defaultChecked={(label) => search.labels?.includes(label)}
                            />
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
    return (
        <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="grid grid-cols-2 max-h-[190px] max-w-[310px] overflow-auto">
                {items.map(item => (
                    <div key={item} className="col-span-1 flex items-center gap-3">
                        <Checkbox
                            id={`${item}-id`}
                            defaultChecked={defaultChecked?.(item)}
                            onCheckedChange={() => onChange(item)}
                        />
                        <label htmlFor={`${item}-id`} className="cursor-pointer line-clamp-1">{item}</label>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SearchFilter = ({ job, dataList, registerChange }) => {
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
            <h3 className="text-lg font-semibold">{capitalize(job)}</h3>
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
        <Pop.PopoverContent className="w-full space-y-3">
            <div className="-mt-2 text-lg font-semibold underline underline-offset-2">
                Examples
            </div>
            <div className="p-2 bg-neutral-800 rounded-md space-y-1">
                <Badge>Drama</Badge> + <Badge>Crime</Badge> <FaArrowRightLong/>
                <Badge>Drama</Badge> OR <Badge>Crime</Badge>
            </div>
            <div className="p-2 bg-neutral-800 rounded-md space-y-1">
                <Badge>Drama</Badge> + <Badge>Crime</Badge> + <Badge
                variant="destructive">France</Badge> <FaArrowRightLong/>
                <Badge>Drama</Badge> OR <Badge>Crime</Badge> from <Badge
                variant="destructive">France</Badge>
            </div>
            <div className="p-2 bg-neutral-800 rounded-md space-y-1">
                <Badge>Drama</Badge> + <Badge>Crime</Badge> + <Badge
                variant="destructive">France</Badge> + <Badge className="bg-green-900 text-white">Watching</Badge>
                <FaArrowRightLong/> <Badge>Drama</Badge> OR <Badge>Crime</Badge> from <Badge
                variant="destructive">France</Badge> AND <Badge className="bg-green-900 text-white">Watching</Badge>
            </div>
        </Pop.PopoverContent>
    </Pop.Popover>
);
