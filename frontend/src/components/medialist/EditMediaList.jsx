import {useRef} from "react";
import {Button} from "@/components/ui/button";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {Popover, PopoverContent, PopoverTrigger, PopoverClose} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const EditMediaList = ({ allStatus, mediaStatus, handleStatus, removeMedia, isCurrent, addFromOtherList }) => {
    const popoverRef = useRef();

    const handlePopoverStatus = (value) => {
        popoverRef?.current?.click();
        handleStatus(value);
    }

    const handlePopoverRemove = () => {
        const confirm = window.confirm("Are you sure you want to delete this media?")
        if (!confirm) return;

        popoverRef?.current?.click();
        removeMedia();
    }

    const handlePopoverAdd = (value) => {
        popoverRef?.current?.click();
        addFromOtherList(value);
    }

    return (
        <div className="absolute top-2 right-2">
            <Popover>
                <PopoverTrigger>
                    <Tooltip text="Edit">
                        <Button variant="ghost" size="icon" className="opacity-75">
                            <DotsVerticalIcon className="h-5 w-5"/>
                        </Button>
                    </Tooltip>
                </PopoverTrigger>
                <PopoverClose ref={popoverRef}/>
                <PopoverContent align="end" className="w-[188px]">
                    {isCurrent &&
                        <>
                            <div className="flex flex-col gap-1">
                                <div>Change status</div>
                                <Select value={mediaStatus} onValueChange={handlePopoverStatus}>
                                    <SelectTrigger size="details" className="w-full">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allStatus.map(status =>
                                            <SelectItem value={status}>{status}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator/>
                            <div className="flex justify-center">
                                <Button variant="destructive" size="sm" onClick={handlePopoverRemove}>
                                    Delete media
                                </Button>
                            </div>
                        </>
                    }
                    {!isCurrent &&
                        <div className="flex flex-col gap-1">
                            <div>Add to your list</div>
                            <Select onValueChange={handlePopoverAdd}>
                                <SelectTrigger size="details" className="w-full">
                                    <SelectValue placeholder="Add to..."/>
                                </SelectTrigger>
                                <SelectContent>
                                    {allStatus.map(status =>
                                        <SelectItem value={status}>{status}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    }
                </PopoverContent>
            </Popover>
        </div>
    )
};
