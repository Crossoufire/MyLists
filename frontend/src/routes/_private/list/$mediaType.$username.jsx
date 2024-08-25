import {toast} from "sonner";
import {useState} from "react";
import {capitalize, cn} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {fetcher} from "@/lib/fetcherLoader";
import {userClient} from "@/api/MyApiClient";
import {Button} from "@/components/ui/button";
import * as Sheet from "@/components/ui/sheet";
import {useLoading} from "@/hooks/LoadingHook";
import * as Pop from "@/components/ui/popover";
import {Tooltip} from "@/components/ui/tooltip";
import {Checkbox} from "@/components/ui/checkbox";
import {MediaCard} from "@/components/app/MediaCard";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import * as Drop from "@/components/ui/dropdown-menu";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {Pagination} from "@/components/app/Pagination";
import {LabelsDialog} from "@/components/app/LabelsDialog";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {SuppMediaInfo} from "@/components/medialist/SuppMediaInfo";
import {EditMediaList} from "@/components/medialist/EditMediaList";
import {LuArrowUpDown, LuFilter, LuList, LuX} from "react-icons/lu";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {RatingListDrop} from "@/components/medialist/RatingListDrop";
import {SearchMediaList} from "@/components/medialist/SearchMediaList";
import {FaArrowUpRightFromSquare, FaCircleCheck} from "react-icons/fa6";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/list/$mediaType/$username")({
    component: MediaList,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ params, deps }) => fetcher(`/list/${params.mediaType}/${params.username}`, deps.search),
});


const StatusComponent = ({ status, allStatus, applyStatus }) => (
    <Drop.DropdownMenu>
        <Drop.DropdownMenuTrigger asChild>
            <Button variant="filters">
                <LuList className="w-4 h-4"/> Status
            </Button>
        </Drop.DropdownMenuTrigger>
        <Drop.DropdownMenuContent align="end">
            {allStatus.map(st =>
                <Drop.DropdownMenuCheckboxItem key={st} checked={status.includes(st)} onSelect={applyStatus}>
                    {st}
                </Drop.DropdownMenuCheckboxItem>
            )}
        </Drop.DropdownMenuContent>
    </Drop.DropdownMenu>
);


const FilterComponent = ({ isCurrent, initFilters, allFilters, applyFilters }) => {
    const [filters, setFilters] = useState(initFilters);

    const checkboxChange = (filterType, value) => {
        setFilters((prevFilters) => {
            if (Array.isArray(prevFilters[filterType])) {
                const updatedArray = prevFilters[filterType].includes(value) ?
                    prevFilters[filterType].filter(item => item !== value)
                    :
                    [...prevFilters[filterType], value];
                return { ...prevFilters, [filterType]: updatedArray };
            }
            else {
                return { ...prevFilters, [filterType]: value };
            }
        });
    };

    const handleOnSubmit = async (ev) => {
        ev.preventDefault();
        await applyFilters(filters);
    };

    return (
        <Sheet.Sheet>
            <Sheet.SheetTrigger asChild>
                <Button variant="filters">
                    <LuFilter className="w-4 h-4"/> Filter
                </Button>
            </Sheet.SheetTrigger>
            <Sheet.SheetContent side="left">
                <Sheet.SheetHeader>
                    <Sheet.SheetTitle>Filtering</Sheet.SheetTitle>
                </Sheet.SheetHeader>
                <form onSubmit={handleOnSubmit} className="overflow-auto max-h-[98%]">
                    <div className="mt-6 mb-6 space-y-4">
                        {!isCurrent &&
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="commonCheck"
                                    defaultChecked={filters.common}
                                    onCheckedChange={() => checkboxChange("common", !filters.common)}
                                />
                                <label htmlFor="commonCheck" className="cursor-pointer">Show/Hide Common</label>
                            </div>
                        }
                        <div>
                            <h3 className="text-lg font-semibold">Status</h3>
                            <ul className="overflow-hidden hover:overflow-auto">
                                {allFilters.all_status.map(status =>
                                    <li key={status} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`${status}-id`}
                                            defaultChecked={filters.status.includes(status)}
                                            onCheckedChange={() => checkboxChange("status", status)}
                                        />
                                        <label htmlFor={`${status}-id`} className="cursor-pointer">{status}</label>
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Genres</h3>
                            <ul className="max-h-[190px] max-w-[300px] overflow-auto">
                                {allFilters.all_genres.map(genre =>
                                    <li key={genre} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`${genre}-id`}
                                            defaultChecked={filters.genres.includes(genre)}
                                            onCheckedChange={() => checkboxChange("genres", genre)}
                                        />
                                        <label htmlFor={`${genre}-id`} className="cursor-pointer">{genre}</label>
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Miscellaneous</h3>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="favoriteCheck"
                                    defaultChecked={filters.favorite === true}
                                    onCheckedChange={() => checkboxChange("favorite", !filters.favorite)}
                                />
                                <label htmlFor="favoriteCheck" className="cursor-pointer">Favorites</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="commentCheck"
                                    defaultChecked={filters.comment === true}
                                    onCheckedChange={() => checkboxChange("comment", !filters.comment)}
                                />
                                <label htmlFor="commentCheck" className="cursor-pointer">Comments</label>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Labels</h3>
                            <ul className="max-h-[190px] max-w-[300px] overflow-auto">
                                {allFilters.all_labels.map(label =>
                                    <li key={label} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`${label}-id`}
                                            defaultChecked={filters.labels.includes(label)}
                                            onCheckedChange={() => checkboxChange("labels", label)}
                                        />
                                        <label htmlFor={`${label}-id`} className="cursor-pointer">{label}</label>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <Sheet.SheetFooter className="pr-2">
                        <Sheet.SheetClose asChild className="w-full">
                            <Button type="submit">Apply Filters</Button>
                        </Sheet.SheetClose>
                    </Sheet.SheetFooter>
                </form>
            </Sheet.SheetContent>
        </Sheet.Sheet>
    );
};


const SortComponent = ({sorting, allSorting, applySorting}) => (
    <Drop.DropdownMenu>
        <Drop.DropdownMenuTrigger asChild>
            <Button variant="filters">
                <LuArrowUpDown className="w-4 h-4"/> Sort
            </Button>
        </Drop.DropdownMenuTrigger>
        <Drop.DropdownMenuContent align="end">
            <Drop.DropdownMenuRadioGroup value={sorting} onValueChange={applySorting}>
                {allSorting.map(sort =>
                    <Drop.DropdownMenuRadioItem key={sort} value={sort}>
                        {sort}
                    </Drop.DropdownMenuRadioItem>
                )}
            </Drop.DropdownMenuRadioGroup>
        </Drop.DropdownMenuContent>
    </Drop.DropdownMenu>
);


const DotsOthers = ({isCurrent}) => {
    const {mediaType, username} = Route.useParams();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Pop.Popover>
                <Pop.PopoverTrigger asChild>
                    <Button variant="filters" className="px-2">
                        <DotsVerticalIcon/>
                    </Button>
                </Pop.PopoverTrigger>
                <Pop.PopoverContent align="end"
                                    className={cn("w-48 pt-3 pb-3 px-1 space-y-2 text-sm", isCurrent && "pt-1")}>
                    {isCurrent &&
                        <Button variant="list" onClick={() => setIsOpen(true)}>
                            Manage {capitalize(mediaType)} Labels
                        </Button>
                    }
                    <div>
                        <Link to={`/stats/${mediaType}/${username}`}>
                            <div className="flex items-center justify-between px-4">
                                <div className="hover:underline">Collection Stats</div>
                                <FaArrowUpRightFromSquare/>
                            </div>
                        </Link>
                    </div>
                </Pop.PopoverContent>
            </Pop.Popover>
            {isCurrent &&
                <LabelsDialog
                    mediaId={1}
                    isOpen={isOpen}
                    manageOnly={true}
                    labelsInList={[]}
                    updateLabelsInList={() => {
                    }}
                    onClose={() => setIsOpen(false)}
                />
            }
        </>
    );
};


const CurrentFilters = ({currentFilters, removeAllFilters, removeFilter}) => {
    return (
        <>
            {currentFilters.length > 0 && <div>&nbsp;&nbsp; | &nbsp;&nbsp;</div>}
            {currentFilters.map(dataDict =>
                dataDict.values.map(filter =>
                    <Badge key={filter} className="border-gray-700 h-8 px-4 text-sm gap-2" variant="outline">
                        {filter}
                        <div role="button" className="hover:opacity-80 -mr-1"
                             onClick={() => removeFilter(dataDict.type, filter)}>
                            <LuX/>
                        </div>
                    </Badge>
                )
            )}
            {currentFilters.length > 0 &&
                <Tooltip text="Remove All Filters" side="right">
                    <div role="button" className="hover:opacity-80" onClick={removeAllFilters}>
                        <LuX/>
                    </div>
                </Tooltip>
            }
        </>
    );
};


export const TopRightCornerTriangle = ({isCommon}) => {
    return (
        <>
            <div className="absolute top-0 right-0 border-solid border-t-0 border-r-[55px] border-b-[55px] border-l-0
            border-[transparent_#030712] opacity-70 rounded-tr-md"/>
            {isCommon && <FaCircleCheck className="absolute top-2 right-2" color="green"/>}
        </>
    );
};


const ShowStatus = ({allStatus, status}) => {
    if (allStatus.length === 1) return;
    return <Badge variant="outline">{status}</Badge>;
};


const MediaItem = ({isCurrent, media, filters, initCommon}) => {
    const {mediaType} = Route.useParams();
    const [isLoading, handleLoading] = useLoading();
    const [status, setStatus] = useState(media.status);
    const [isCommon, setIsCommon] = useState(initCommon);
    const [isHidden, setIsHidden] = useState(false);
    const updateUserAPI = useApiUpdater(media.media_id, mediaType);

    const handleRemoveMedia = async () => {
        const response = await handleLoading(updateUserAPI.deleteMedia);
        if (response) {
            setIsHidden(true);
            toast.success("Media successfully deleted");
        }
    };

    const handleStatus = async (status) => {
        const response = await handleLoading(updateUserAPI.status, status);
        if (response) {
            if (filters.status.length === 1) {
                setIsHidden(true);
            }
            setStatus(status);
            toast.success(`Media status changed to ${status}`);
        }
    };

    const handleAddOtherList = async (value) => {
        const response = await handleLoading(updateUserAPI.addMedia, value);
        if (response) {
            setIsCommon(true);
            toast.success("Media added to your list");
        }
    };

    if (isHidden) return;

    return (
        <MediaCard media={media} mediaType={mediaType} isLoading={isLoading}>
            <div className="absolute top-2 right-1 z-10">
                {(isCurrent || (!isCurrent && !isCommon)) &&
                    <EditMediaList
                        status={status}
                        isCurrent={isCurrent}
                        handleStatus={handleStatus}
                        allStatus={media.all_status}
                        removeMedia={handleRemoveMedia}
                        addOtherList={handleAddOtherList}
                    />
                }
            </div>
            <div className="absolute top-1.5 left-1.5 z-10 bg-gray-950 px-2 rounded-md opacity-85">
                <SuppMediaInfo
                    media={media}
                    status={status}
                    isCurrent={isCurrent}
                    updateUserAPI={updateUserAPI}
                />
            </div>
            <TopRightCornerTriangle
                isCommon={isCommon}
            />
            <div className="absolute bottom-0 px-4 pt-2 pb-2 space-y-2 bg-gray-950 w-full rounded-b-sm">
                <h3 className="font-semibold line-clamp-1" title={media.media_name}>
                    {media.media_name}
                </h3>
                <ShowStatus
                    status={status}
                    allStatus={filters.status}
                />
                <div className="flex items-center justify-between h-[24px]">
                    <ManageFavorite
                        isCurrent={isCurrent}
                        initFav={media.favorite}
                        updateFavorite={updateUserAPI.favorite}
                    />
                    <RatingListDrop
                        isCurrent={isCurrent}
                        initRating={media.rating}
                        updateRating={updateUserAPI.rating}
                    />
                    {(status === "Completed" && mediaType !== "games") &&
                        <RedoListDrop
                            isCurrent={isCurrent}
                            initRedo={media.redo}
                            updateRedo={updateUserAPI.redo}
                        />
                    }
                    <CommentPopover
                        isCurrent={isCurrent}
                        initContent={media.comment}
                        updateComment={updateUserAPI.comment}
                    />
                </div>
            </div>
        </MediaCard>
    );
};


function MediaList() {
    const navigate = useNavigate();
    const apiData = Route.useLoaderData();
    const { username, mediaType } = Route.useParams();
    const isCurrent = (userClient.currentUser.id === apiData.user_data.id);

    const fetchNewData = async (params) => {
        if (JSON.stringify(params) === JSON.stringify(apiData.filters)) {
            return;
        }

        // noinspection JSCheckFunctionSignatures
        await navigate({ search: params });
    };

    const removeAFilter = async (type, filter) => {
        const newFilters = { ...apiData.filters };
        if (Array.isArray(newFilters[type])) {
            newFilters[type] = newFilters[type].filter(f => f !== filter);
        }
        else {
            delete newFilters[type];
        }
        await fetchNewData({ ...newFilters, page: 1 });
    };

    const removeAllFilters = async () => {
        await fetchNewData({ sort: apiData.filters.sort, page: 1 });
    };

    const applyFilters = async (filters) => {
        await fetchNewData({ ...filters, page: 1 });
    };

    const applySorting = async (sortValue) => {
        await fetchNewData({ ...apiData.filters, sort: sortValue, page: 1 });
    };

    const applyStatus = async (ev) => {
        await fetchNewData({ ...apiData.filters, status: [ev.target.textContent], page: 1 });
    };

    const onPageChange = async (page) => {
        await fetchNewData({ ...apiData.filters, page });
    };

    const updateSearch = async (search) => {
        await fetchNewData({ ...apiData.filters, search, page: 1 });
    };

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Collection`} onlyHelmet>
            <div className="flex flex-wrap items-center justify-between mt-8 mb-6 gap-6">
                <h3 className="text-3xl font-medium line-clamp-1">
                    {username} {capitalize(mediaType)} Collection
                </h3>
                <div className="flex flex-wrap gap-3">
                    <SearchMediaList
                        updateSearch={updateSearch}
                    />
                    <StatusComponent
                        applyStatus={applyStatus}
                        status={apiData.filters.status}
                        allStatus={apiData.pagination.all_status}
                    />
                    <FilterComponent
                        isCurrent={isCurrent}
                        applyFilters={applyFilters}
                        initFilters={apiData.filters}
                        allFilters={apiData.pagination}
                        key={JSON.stringify(apiData.filters)}
                    />
                    <SortComponent
                        applySorting={applySorting}
                        sorting={apiData.filters.sort}
                        allSorting={apiData.pagination.all_sorting}
                    />
                    <DotsOthers isCurrent={isCurrent}/>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-8">
                <div className="font-medium text-lg">
                    {apiData.pagination.total} {capitalize(mediaType)}
                </div>
                <CurrentFilters
                    removeFilter={removeAFilter}
                    removeAllFilters={removeAllFilters}
                    currentFilters={apiData.current_filters}
                />
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:gap-4 lg:grid-cols-5 sm:gap-5">
                {apiData.media_data.media_list.map(media =>
                    <MediaItem
                        media={media}
                        key={media.media_id}
                        isCurrent={isCurrent}
                        filters={apiData.filters}
                        initCommon={apiData.media_data.common_ids.includes(media.media_id)}
                    />
                )}
            </div>
            <Pagination
                currentPage={apiData.pagination.page}
                totalPages={apiData.pagination.pages}
                onChangePage={onPageChange}
            />
        </PageTitle>
    );
}
