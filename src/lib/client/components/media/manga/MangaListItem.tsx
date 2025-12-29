import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {DisplayChapters} from "@/lib/client/components/media/base/DisplayChapters";
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
                <DisplayChapters
                    status={props.userMedia.status}
                    total={props.userMedia.chapters}
                    currentChapter={props.userMedia.currentChapter}
                />
            }
        />
    );
};
