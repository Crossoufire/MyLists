import React from "react";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractFollowByType} from "@/lib/components/types";
import {DisplayPages} from "@/lib/components/media/books/DisplayPages";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";


interface BookFollowCardProps {
    rating: React.ReactNode;
    followData: ExtractFollowByType<typeof MediaType.BOOKS>;
}


export const BookFollowCard = ({ followData, rating }: BookFollowCardProps) => {
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
                    pages={followData.userMedia.actualPage}
                />
            }
        />
    );
};