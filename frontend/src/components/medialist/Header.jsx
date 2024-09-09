import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button";
import * as Pop from "@/components/ui/popover";
import {capitalize, cn} from "@/utils/functions.jsx";
import * as Drop from "@/components/ui/dropdown-menu";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {FaArrowUpRightFromSquare} from "react-icons/fa6";
import {LabelsDialog} from "@/components/app/LabelsDialog";
import {Route} from "@/routes/_private/list/$mediaType.$username";
import {LuArrowUpDown, LuFilter, LuGrid, LuList} from "react-icons/lu";
import {SearchComponent} from "@/components/medialist/SearchComponent";
import {MediaLevelCircle} from "@/components/app/base/MediaLevelCircle";


export const Header = (props) => {
    const sorting = props.pagination.sorting;
    const allStatus = props.pagination.all_status;
    const allSorting = props.pagination.all_sorting;
    const { username, mediaType } = Route.useParams();

    return (
        <div className="flex flex-wrap items-center justify-between mt-8 mb-6 gap-6">
            <h3 className="flex items-center gap-3 text-3xl font-medium line-clamp-1">
                <MediaLevelCircle intLevel={parseInt(props.userData.settings[mediaType].level)}/>
                {`${username} ${capitalize(mediaType)} Collection`}
            </h3>
            <div className="flex flex-wrap gap-3">
                <SearchComponent
                    onSearchEnter={props.onSearchEnter}
                />
                <StatusComponent
                    allStatus={allStatus}
                    onStatusChange={props.onStatusChange}
                />
                <Button variant="filters" onClick={props.onFilterClick}>
                    <LuFilter className="w-4 h-4"/> Filters
                </Button>
                <SortComponent
                    sorting={sorting}
                    allSorting={allSorting}
                    applySorting={props.onSortChange}
                />
                <div className="flex items-center gap-3">
                    <Button variant="filters" onClick={props.handleGridChange}>
                        {props.isGrid ? <LuList className="w-4 h-4"/> : <LuGrid className="w-4 h-4"/>}
                    </Button>
                </div>

                <DotsOthers
                    isCurrent={props.isCurrent}
                />
            </div>
        </div>
    );
};


const StatusComponent = ({ allStatus, onStatusChange }) => {
    const search = Route.useSearch();

    const handleStatusChange = (status) => {
        search.status = search.status ? search.status : [];
        onStatusChange({ status: [...search.status, status] });
    };

    return (
        <Drop.DropdownMenu>
            <Drop.DropdownMenuTrigger asChild>
                <Button variant="filters">
                    <LuList className="w-4 h-4"/> Status
                </Button>
            </Drop.DropdownMenuTrigger>
            <Drop.DropdownMenuContent align="end">
                {allStatus.map(st =>
                    <Drop.DropdownMenuCheckboxItem
                        key={st}
                        onSelect={() => handleStatusChange(st)}
                        checked={search.status ? search.status.includes(st) : []}
                    >
                        {st}
                    </Drop.DropdownMenuCheckboxItem>
                )}
            </Drop.DropdownMenuContent>
        </Drop.DropdownMenu>
    );
};


const SortComponent = ({ sorting, allSorting, applySorting }) => {
    return (
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
};


const DotsOthers = ({ isCurrent }) => {
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
                <Pop.PopoverContent align="end" className={cn("w-48 pt-3 pb-3 px-1 space-y-2 text-sm", isCurrent && "pt-1")}>
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
                    updateLabelsInList={() => {}}
                    onClose={() => setIsOpen(false)}
                />
            }
        </>
    );
};