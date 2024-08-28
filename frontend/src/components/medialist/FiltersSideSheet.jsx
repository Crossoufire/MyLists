import {toast} from "sonner";
import {LuX} from "react-icons/lu";
import {api} from "@/api/MyApiClient";
import {useRef, useState} from "react";
import {capitalize} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {fetcher} from "@/lib/fetcherLoader";
import {Button} from "@/components/ui/button";
import {useQuery} from "@tanstack/react-query";
import * as Sheet from "@/components/ui/sheet";
import {useDebounce} from "@/hooks/DebounceHook";
import {Checkbox} from "@/components/ui/checkbox";
import {Loading} from "@/components/app/base/Loading";
import {useOnClickOutside} from "@/hooks/ClickedOutsideHook";
import {Route} from "@/routes/_private/list/$mediaType.$username.jsx";


export const FiltersSideSheet = ({isCurrent, onClose, allStatus, onFilterApply}) => {
    let localFilters = {};
    const search = Route.useSearch();
    const {username, mediaType} = Route.useParams();
    const {data: additionalFilters, isLoading} = useQuery({
        queryKey: ["additionalFilters"],
        queryFn: () => fetcher(`/list/filters/${mediaType}/${username}`),
    });

    const checkboxChange = (filterType, value) => {
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
            } else {
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
            <Sheet.SheetContent>
                <Sheet.SheetHeader>
                    <Sheet.SheetTitle>Additional Filters</Sheet.SheetTitle>
                    <Sheet.SheetDescription/>
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
                                        onCheckedChange={() => checkboxChange("common", !search.common)}
                                    />
                                    <label htmlFor="commonCheck" className="cursor-pointer">Hide Common</label>
                                </div>
                            }
                            <div>
                                <h3 className="text-lg font-semibold">Status</h3>
                                <ul className="overflow-hidden hover:overflow-auto">
                                    {allStatus.map(status =>
                                        <li key={status} className="flex items-center gap-3">
                                            <Checkbox
                                                id={`${status}-id`}
                                                defaultChecked={search.status?.includes(status)}
                                                onCheckedChange={() => checkboxChange("status", [status])}
                                            />
                                            <label htmlFor={`${status}-id`} className="cursor-pointer">{status}</label>
                                        </li>
                                    )}
                                </ul>
                            </div>
                            <AdditionalFilter
                                job="actors"
                                dataList={search.actors}
                                checkboxChange={checkboxChange}
                            />
                            <AdditionalFilter
                                job="directors"
                                dataList={search.directors}
                                checkboxChange={checkboxChange}
                            />
                            <div>
                                <h3 className="text-lg font-semibold">Genres</h3>
                                <div className="grid grid-cols-2 max-h-[190px] max-w-[310px] overflow-auto">
                                    {additionalFilters.genres?.map(genre =>
                                        <div key={genre} className="col-span-1 flex items-center gap-3">
                                            <Checkbox
                                                id={`${genre}-id`}
                                                defaultChecked={search.genres?.includes(genre)}
                                                onCheckedChange={() => checkboxChange("genres", [genre])}
                                            />
                                            <label htmlFor={`${genre}-id`} className="cursor-pointer line-clamp-1">
                                                {genre}
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Miscellaneous</h3>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="favoriteCheck"
                                        defaultChecked={search.favorite}
                                        onCheckedChange={() => checkboxChange("favorite", !search.favorite)}
                                    />
                                    <label htmlFor="favoriteCheck" className="cursor-pointer">Favorites</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="commentCheck"
                                        defaultChecked={search.comment}
                                        onCheckedChange={() => checkboxChange("comment", !search.comment)}
                                    />
                                    <label htmlFor="commentCheck" className="cursor-pointer">Comments</label>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Labels</h3>
                                <ul className="max-h-[190px] max-w-[300px] overflow-auto">
                                    {additionalFilters.labels?.map(label =>
                                        <li key={label} className="flex items-center gap-3">
                                            <Checkbox
                                                id={`${label}-id`}
                                                defaultChecked={search.labels?.includes(label)}
                                                onCheckedChange={() => checkboxChange("labels", [label])}
                                            />
                                            <label htmlFor={`${label}-id`} className="cursor-pointer">{label}</label>
                                        </li>
                                    )}
                                </ul>
                            </div>
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


const AdditionalFilter = ({ job, dataList, checkboxChange }) => {
    const searchRef = useRef();
    const [results, setResults] = useState();
    const {mediaType, username} = Route.useParams();
    const [query, setQuery] = useState("");
    const [selectedData, setSelectedData] = useState(dataList ? dataList : []);

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
        checkboxChange(job, [data]);
        setSelectedData([...selectedData, data]);
    };

    const handleRemoveData = (data) => {
        checkboxChange(job, [data]);
        setSelectedData(selectedData.filter(d => d !== data));
    };

    useOnClickOutside(searchRef, () => resetSearch());
    useDebounce(query, 250, searchDB);

    return (
        <div>
            <h3 className="text-lg font-semibold">{capitalize(job)}</h3>
            <div ref={searchRef} className="mt-1 w-56 relative">
                <Input
                    value={query}
                    placeholder={`Search ${job}`}
                    onChange={handleSearchChange}
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
            <div className="absolute h-[52px] w-56 top-11 bg-background border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    <Loading/>
                </div>
            </div>
        );
    }
    if (results === undefined) {
        return;
    }
    if (results.length === 0) {
        return (
            <div className="absolute h-[40px] w-56 top-11 bg-background border rounded-md font-medium">
                <div className="ml-2 mt-2">
                    Sorry, no matches found
                </div>
            </div>
        );
    }

    return (
        <div className="absolute max-h-[200px] w-56 top-11 bg-background border rounded-md font-medium overflow-y-auto">
            {results.map(item =>
                <div key={item} role="button" className="flex p-1 items-center w-full hover:bg-neutral-900"
                     onClick={() => handleAddClicked(item)}>
                    <div>{item}</div>
                </div>
            )}
        </div>
    );
};
