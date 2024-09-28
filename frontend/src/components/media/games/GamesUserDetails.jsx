import {cn} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import React, {useEffect, useState} from "react";
import {Separator} from "@/components/ui/separator";
import {CaretSortIcon, CheckIcon} from "@radix-ui/react-icons";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {PlaytimeDrop} from "@/components/media/games/PlaytimeDrop";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";


export const GamesUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const { updateRating, updatePlaytime, updatePlatform, updateStatusFunc } = userMediaMutations(mediaType, userMedia.media_id, queryKey);

    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        newData.user_media.status = variables.payload;
        if (variables.payload === "Plan to Play") newData.user_media.playtime = 0;
        return newData;
    };

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                allStatus={userMedia.all_status}
                updateStatus={updateStatusFunc(onStatusSuccess)}
            />
            <PlatformDrop
                platform={userMedia.platform}
                updatePlatform={updatePlatform}
                allPlatforms={userMedia.all_platforms}
            />
            {userMedia.status !== "Plan to Play" &&
                <>
                    <Separator/>
                    <PlaytimeDrop
                        playtime={userMedia.playtime}
                        updatePlaytime={updatePlaytime}
                    />
                    <div className="flex justify-between items-center">
                        <div>Rating</div>
                        <RatingComponent
                            onUpdate={updateRating}
                            rating={userMedia.rating}
                        />
                    </div>
                </>
            }
        </>
    );
};


function PlatformDrop({ platform, allPlatforms, updatePlatform }) {
    const handleSelect = (platform) => {
        updatePlatform.mutate({ payload: platform });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Platform</div>
            <PlatformComboBox
                resetValue={platform}
                callback={handleSelect}
                isPending={updatePlatform.isPending}
                dataList={allPlatforms.map(p => ({ value: p, label: p }))}
            />
        </div>
    );
}

const PlatformComboBox = ({ resetValue = "", dataList, callback, isPending }) => {
    const [value, setValue] = useState(resetValue);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setValue(resetValue);
    }, [resetValue]);

    const onSelect = async (currentValue) => {
        setOpen(false);
        setValue(currentValue === value ? "" : currentValue);
        await callback(currentValue);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button role="combobox" variant="outline" className="flex h-7 pl-2 w-[130px] items-center justify-between
                whitespace-nowrap rounded-md focus-visible:ring-0 ring-offset-background placeholder:text-muted-foreground
                focus:outline-none focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1
                bg-transparent border-none font-normal pr-0 hover:bg-transparent"
                        aria-expanded={open} disabled={isPending}>
                    {value ? dataList.find(user => user.value === value)?.label : "--"}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[160px] p-0">
                <Command className="overflow-y-auto max-h-[270px]">
                    <CommandInput placeholder="Search..." className="h-9"/>
                    <CommandList>
                        <CommandEmpty>No results</CommandEmpty>
                        <CommandGroup>
                            {dataList.map(user =>
                                <CommandItem key={user.value} value={user.value} onSelect={() => onSelect(user.value)}>
                                    {user.label}
                                    <CheckIcon className={cn("ml-auto h-4 w-4", value === user.value ? "opacity-100" : "opacity-0")}/>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
