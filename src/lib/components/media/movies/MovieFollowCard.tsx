import {MediaType} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media-config";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";


type MovieFollowCardProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaFollowCard"]>[0];


export const MovieFollowCard = ({ followData, rating }: MovieFollowCardProps<typeof MediaType.MOVIES>) => {
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