import React from "react";
import {ExtractListByType} from "@/lib/components/types";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {DisplayPlaytime} from "@/lib/components/media/games/DisplayPlaytime";
import {BaseMediaListItem} from "@/lib/components/media/base/BaseMediaListItem";


interface GameListItemProps {
    isCurrent: boolean;
    isConnected: boolean;
    mediaType: MediaType;
    allStatuses: Status[];
    rating: React.ReactNode;
    queryKey: ReturnType<typeof queryKeys.userListKey>;
    userMedia: ExtractListByType<typeof MediaType.GAMES>;
}


export const GameListItem = (props: GameListItemProps) => {
    return (
        <BaseMediaListItem
            {...props}
            mediaDetailsDisplay={
                <DisplayPlaytime
                    status={props.userMedia.status}
                    playtime={props.userMedia.playtime}
                />
            }
        />
    );
};