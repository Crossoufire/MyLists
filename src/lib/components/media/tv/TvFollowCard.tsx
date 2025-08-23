import {MediaType} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media-config";
import {DisplayTvRedo} from "@/lib/components/media/tv/DisplayTvRedo";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";
import {DisplayEpsAndSeasons} from "@/lib/components/media/tv/DisplayEpsAndSeasons";


type TvFollowCardProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaFollowCard"]>[0];


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
                    currentEpisode={followData.userMedia.lastEpisodeWatched}
                />
            }
        />
    );
};