import React from "react";
import {MediaType} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media-config";
import {DisplayPages} from "@/lib/components/media/base/DisplayPages";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaListItem} from "@/lib/components/media/base/BaseMediaListItem";


type MangaListItemProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaListCard"]>[0];


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
