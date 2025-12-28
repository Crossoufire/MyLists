import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {DisplayPages} from "@/lib/client/components/media/base/DisplayPages";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {DisplayRedoValue} from "@/lib/client/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/client/components/media/base/BaseMediaFollowCard";


type MangaFollowCardProps<T extends MediaType> = Parameters<MediaConfig[T]["mediaFollowCard"]>[number];


export const MangaFollowCard = ({ followData, rating }: MangaFollowCardProps<typeof MediaType.MANGA>) => {
    return (
        <BaseMediaFollowCard
            rating={rating}
            followData={followData}
            redoDisplay={
                <DisplayRedoValue
                    redoValue={followData.userMedia.redo}
                />
            }
            mediaDetailsDisplay={
                <DisplayPages
                    status={followData.userMedia.status}
                    currentPage={followData.userMedia.currentChapter}
                />
            }
        />
    );
};