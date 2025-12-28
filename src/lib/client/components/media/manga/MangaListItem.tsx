import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {DisplayPages} from "@/lib/client/components/media/base/DisplayPages";
import {DisplayRedoValue} from "@/lib/client/components/media/base/DisplayRedoValue";
import {BaseMediaListItem} from "@/lib/client/components/media/base/BaseMediaListItem";


type MangaListItemProps<T extends MediaType> = Parameters<MediaConfig[T]["mediaListCard"]>[number];


export const MangaListItem = (props: MangaListItemProps<typeof MediaType.MANGA>) => {
    return (
        <BaseMediaListItem
            {...props}
            redoDisplay={!!props.userMedia.redo &&
                <DisplayRedoValue
                    redoValue={props.userMedia.redo}
                />
            }
            mediaDetailsDisplay={
                <DisplayPages
                    status={props.userMedia.status}
                    total={props.userMedia.chapters}
                    currentPage={props.userMedia.currentChapter}
                />
            }
        />
    );
};
