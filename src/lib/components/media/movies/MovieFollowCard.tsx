import {MediaType} from "@/lib/server/utils/enums";
import {ExtractFollowByType} from "@/lib/components/types";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";


interface MovieFollowCardProps {
    rating: React.ReactNode;
    followData: ExtractFollowByType<typeof MediaType.MOVIES>;
}


export const MovieFollowCard = ({ followData, rating }: MovieFollowCardProps) => {
    return (
        <BaseMediaFollowCard
            rating={rating}
            followData={followData}
            redoDisplay={
                <DisplayRedoValue
                    redoValue={followData.userMedia.redo}
                />
            }
        />
    );
};