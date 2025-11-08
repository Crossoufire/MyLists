import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {DisplayPages} from "@/lib/client/components/media/base/DisplayPages";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {DisplayRedoValue} from "@/lib/client/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/client/components/media/base/BaseMediaFollowCard";


type BookFollowCardProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaFollowCard"]>[number];


export const BookFollowCard = ({ followData, rating }: BookFollowCardProps<typeof MediaType.BOOKS>) => {
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
                    currentPage={followData.userMedia.actualPage}
                />
            }
        />
    );
};