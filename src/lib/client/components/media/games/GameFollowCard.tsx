import {MediaType} from "@/lib/utils/enums";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {DisplayPlaytime} from "@/lib/client/components/media/games/DisplayPlaytime";
import {BaseMediaFollowCard} from "@/lib/client/components/media/base/BaseMediaFollowCard";


type GameFollowCardProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaFollowCard"]>[0];


export const GameFollowCard = ({ followData, rating }: GameFollowCardProps<typeof MediaType.GAMES>) => {
    return (
        <BaseMediaFollowCard
            rating={rating}
            followData={followData}
            mediaDetailsDisplay={
                <DisplayPlaytime
                    status={followData.userMedia.status}
                    playtime={followData.userMedia.playtime}
                />
            }
        />
    );
};