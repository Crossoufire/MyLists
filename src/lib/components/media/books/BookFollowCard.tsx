import React from "react";
import {MediaType} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media-config";
import {DisplayPages} from "@/lib/components/media/books/DisplayPages";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";


type BookFollowCardProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaFollowCard"]>[0];


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
                    total={150}
                    status={followData.userMedia.status}
                    currentPage={followData.userMedia.actualPage}
                />
            }
        />
    );
};