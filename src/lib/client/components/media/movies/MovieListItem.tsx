import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {DisplayRedoValue} from "@/lib/client/components/media/base/DisplayRedoValue";
import {BaseMediaListItem} from "@/lib/client/components/media/base/BaseMediaListItem";


type MovieListItemProps<T extends MediaType> = Parameters<MediaConfig[T]["mediaListCard"]>[number];


export const MovieListItem = (props: MovieListItemProps<typeof MediaType.MOVIES>) => {
    return (
        <BaseMediaListItem
            {...props}
            redoDisplay={!!props.userMedia.redo &&
                <DisplayRedoValue
                    redoValue={props.userMedia.redo}
                />
            }
        />
    );
};
