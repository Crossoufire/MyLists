import {MediaType} from "@/lib/utils/enums";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {DisplayRedoValue} from "@/lib/client/components/media/base/DisplayRedoValue";
import {BaseMediaFollowCard} from "@/lib/client/components/media/base/BaseMediaFollowCard";


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