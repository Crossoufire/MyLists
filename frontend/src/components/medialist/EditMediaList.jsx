import {useRef} from "react";
import {Button} from "@/components/ui/button";
import {Tooltip} from "@/components/ui/tooltip";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const EditMediaList = ({ allStatus, mediaStatus, handleStatus, removeMedia, isCurrent, addFromOtherList }) => {
    const popoverCloseRef = useRef();

    const handlePopoverStatus = (value) => {
        popoverCloseRef?.current?.click();
        handleStatus(value);
    };

    const handlePopoverRemove = () => {
        const confirm = window.confirm("Are you sure you want to delete this media?");
        if (!confirm) return;

        popoverCloseRef?.current?.click();
        removeMedia();
    };

    const handlePopoverAdd = (value) => {
        popoverCloseRef?.current?.click();
        addFromOtherList(value);
    };

    return (
        <div className="absolute top-1 right-1">
            <Popover>
                <PopoverTrigger>
                    <Tooltip text="Edit">
                        <DotsVerticalIcon className="h-5 w-5 mt-2 mr-1 opacity-50 hover:opacity-100"/>
                    </Tooltip>
                </PopoverTrigger>
                <PopoverClose ref={popoverCloseRef}/>
                <PopoverContent align="end" className="w-[196px] py-2 px-0">
                    <div className="text-center mb-3 text-neutral-400 text-sm">Edit media</div>
                    {isCurrent &&
                        <>
                            <Select onValueChange={handlePopoverStatus}>
                                <SelectTrigger variant="list" size="editList">
                                    <SelectValue placeholder="Change Status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {allStatus.map(status =>
                                        <SelectItem key={status} value={status} disabled={status === mediaStatus}>
                                            {status}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <Button variant="list" onClick={handlePopoverRemove}>
                                Delete media
                            </Button>
                        </>
                    }
                    {!isCurrent &&
                        <Select onValueChange={handlePopoverAdd}>
                            <SelectTrigger variant="list" size="editList">
                                <SelectValue placeholder="Add to your list"/>
                            </SelectTrigger>
                            <SelectContent>
                                {allStatus.map(status =>
                                    <SelectItem key={status} value={status}>
                                        {status}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    }
                </PopoverContent>
            </Popover>
        </div>
    )
};
