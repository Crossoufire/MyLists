import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {DisplayPlaytime} from "@/lib/client/components/media/games/DisplayPlaytime";
import {BaseMediaListItem} from "@/lib/client/components/media/base/BaseMediaListItem";


type GameListItemProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaListCard"]>[0];


export const GameListItem = (props: GameListItemProps<typeof MediaType.GAMES>) => {
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