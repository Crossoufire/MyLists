import {useState} from "react";
import {Link} from "@tanstack/react-router";
import {capitalize} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {LabelsDialog} from "@/components/app/LabelsDialog";
import {LuArrowUpDown, LuFilter, LuGrid, LuList} from "react-icons/lu";
import {SearchComponent} from "@/components/medialist/SearchComponent";
import {MediaLevelCircle} from "@/components/app/base/MediaLevelCircle";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";


export const Header = (props) => {
    const { username, mediaType } = Route.useParams();
    const { sorting, all_status: allStatus, all_sorting: allSorting } = props.pagination;

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
        onStatusChange({ status: [...(search.status || []), status] });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="filters">
                    <LuList className="w-4 h-4"/> Status
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {allStatus.map(st =>
                    <DropdownMenuCheckboxItem
                        key={st}
                        onSelect={() => handleStatusChange(st)}
                        checked={search.status ? search.status.includes(st) : []}
                    >
                        {st}
                    </DropdownMenuCheckboxItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


const SortComponent = ({ sorting, allSorting, applySorting }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="filters">
                    <LuArrowUpDown className="w-4 h-4"/> Sort
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={sorting} onValueChange={applySorting}>
                    {allSorting.map(sort =>
                        <DropdownMenuRadioItem key={sort} value={sort}>
                            {sort}
                        </DropdownMenuRadioItem>
                    )}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


const DotsOthers = ({ isCurrent }) => {
    const { mediaType, username } = Route.useParams();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="filters" className="px-2">
                        <DotsVerticalIcon/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-46 py-1 px-1 text-sm">
                    <Button variant="list" asChild>
                        <Link to={`/profile/${username}`}>
                            User's profile
                        </Link>
                    </Button>
                    <Button variant="list" asChild>
                        <Link to={`/stats/${mediaType}/${username}`}>
                            Collection Stats
                        </Link>
                    </Button>
                    {isCurrent &&
                        <Button variant="list" onClick={() => setIsOpen(true)}>
                            Manage Labels
                        </Button>
                    }
                </PopoverContent>
            </Popover>
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