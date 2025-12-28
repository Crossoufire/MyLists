import {MediaType} from "@/lib/utils/enums";
import {DisplayTvRedo} from "@/lib/client/components/media/tv/DisplayTvRedo";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {BaseMediaFollowCard} from "@/lib/client/components/media/base/BaseMediaFollowCard";
import {DisplayEpsAndSeasons} from "@/lib/client/components/media/tv/DisplayEpsAndSeasons";


type TvFollowCardProps<T extends MediaType> = Parameters<MediaConfig[T]["mediaFollowCard"]>[number];


export const TvFollowCard = ({ followData, rating }: TvFollowCardProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    return (
        <BaseMediaFollowCard
            rating={rating}
            followData={followData}
            redoDisplay={
                <DisplayTvRedo
                    redoValues={followData.userMedia.redo2}
                />
            }
            mediaDetailsDisplay={
                <DisplayEpsAndSeasons
                    status={followData.userMedia.status}
                    currentSeason={followData.userMedia.currentSeason}
                    currentEpisode={followData.userMedia.currentEpisode}
                />
            }
        />
    );
};