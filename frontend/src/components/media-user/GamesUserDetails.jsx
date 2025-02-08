import {cn} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import {Check, ChevronDown} from "lucide-react";
import React, {useEffect, useState} from "react";
import {Separator} from "@/components/ui/separator";
import {StatusDrop} from "@/components/media-user/StatusDrop";
import {RatingComponent} from "@/components/app/RatingComponent";
import {PlaytimeDrop} from "@/components/media-user/PlaytimeDrop";
import {useUpdateStatusMutation, useUserMediaMutations} from "@/api/mutations";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";


export const GamesUserDetails = ({ userMedia, mediaType, queryKey }) => {
    const { updateRating, updatePlaytime, updatePlatform } = useUserMediaMutations(mediaType, userMedia.media_id, queryKey);
    const updateStatus = useUpdateStatusMutation(mediaType, userMedia.media_id, queryKey, onStatusSuccess);

    const updateMedia = (media, status) => {
        const updatedMedia = { ...media, status };
        if (status === "Plan to Play") {
            updatedMedia.playtime = 0;
        }
        return updatedMedia;
    };

    function onStatusSuccess(oldData, variables) {
        const status = variables.payload;

        if (queryKey[0] === "details") {
            return { ...oldData, user_media: updateMedia(oldData.user_media, status) };
        }

        return {
            ...oldData,
            media_data: oldData.media_data.map(m =>
                m.media_id === userMedia.media_id ? updateMedia(m, status) : m
            )
        };
    }

    return (
        <>
            <StatusDrop
                status={userMedia.status}
                updateStatus={updateStatus}
                allStatus={userMedia.all_status}
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
                    <ChevronDown className="h-3 w-3 opacity-80"/>
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
                                    <Check className={cn("ml-auto h-4 w-4", value === user.value ? "opacity-100" : "opacity-0")}/>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
