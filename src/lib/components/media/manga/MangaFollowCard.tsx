import React from "react";
import {MediaType} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media/media-config";
import {DisplayPages} from "@/lib/components/media/base/DisplayPages";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";


type MangaFollowCardProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaFollowCard"]>[0];


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