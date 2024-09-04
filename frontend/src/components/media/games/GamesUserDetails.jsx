import {cn} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import * as Com from "@/components/ui/command";
import React, {useEffect, useState} from "react";
import {Separator} from "@/components/ui/separator";
import {useUpdateUserMedia} from "@/utils/mutations";
import {CaretSortIcon, CheckIcon} from "@radix-ui/react-icons";
import {RatingDrop} from "@/components/media/general/RatingDrop";
import {StatusDrop} from "@/components/media/general/StatusDrop";
import {PlaytimeDrop} from "@/components/media/games/PlaytimeDrop";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const GamesUserDetails = ({ userData, mediaType, mediaId }) => {
    const onStatusSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        newData.user_data.status = variables.payload;
        if (variables.payload === "Plan to Play") newData.user_data.playtime = 0;
        return newData;
    };
    const onRatingSuccess = (oldData, variables) => {
        return {
            ...oldData,
            user_data: {
                ...oldData.user_data,
                rating: {
                    ...oldData.user_data.rating,
                    value: variables.payload,
                }
            },
        };
    };
    const onPlaytimeSuccess = (oldData, variables) => {
        return {...oldData, user_data: { ...oldData.user_data, playtime: variables.payload } };
    };
    const onPlatformSuccess = (oldData, variables) => {
        return { ...oldData, user_data: { ...oldData.user_data, platform: variables.payload } };
    };

    const statusMutation = useUpdateUserMedia("update_status", mediaType, mediaId, onStatusSuccess);
    const ratingMutation = useUpdateUserMedia("update_rating", mediaType, mediaId, onRatingSuccess);
    const playtimeMutation = useUpdateUserMedia("update_playtime", mediaType, mediaId, onPlaytimeSuccess);
    const platformMutation = useUpdateUserMedia("update_platform", mediaType, mediaId, onPlatformSuccess);

    return (
        <>
            <StatusDrop
                status={userData.status}
                updateStatus={statusMutation}
                allStatus={userData.all_status}
            />
            <PlatformDrop
                platform={userData.platform}
                updatePlatform={platformMutation}
                allPlatforms={userData.all_platforms}
            />
            {userData.status !== "Plan to Play" &&
                <>
                    <Separator/>
                    <PlaytimeDrop
                        playtime={userData.playtime}
                        updatePlaytime={playtimeMutation}
                    />
                    <RatingDrop
                        rating={userData.rating}
                        updateRating={ratingMutation}
                    />
                </>
            }
        </>
    )
};


function PlatformDrop({ platform, allPlatforms, updatePlatform }) {
    const handleSelect = async (platform) => {
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
                <Com.Command className="overflow-y-auto max-h-[270px]">
                    <Com.CommandInput placeholder="Search..." className="h-9"/>
                    <Com.CommandList>
                        <Com.CommandEmpty>No results</Com.CommandEmpty>
                        <Com.CommandGroup>
                            {dataList.map(user =>
                                <Com.CommandItem key={user.value} value={user.value} onSelect={() => onSelect(user.value)}>
                                    {user.label}
                                    <CheckIcon
                                        className={cn("ml-auto h-4 w-4",
                                            value === user.value ? "opacity-100" : "opacity-0")}
                                    />
                                </Com.CommandItem>
                            )}
                        </Com.CommandGroup>
                    </Com.CommandList>
                </Com.Command>
            </PopoverContent>
        </Popover>
    )
};
