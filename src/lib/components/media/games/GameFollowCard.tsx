import {MediaType} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media-config";
import {DisplayPlaytime} from "@/lib/components/media/games/DisplayPlaytime";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";


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