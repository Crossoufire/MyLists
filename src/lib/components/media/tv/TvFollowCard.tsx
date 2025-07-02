import {MediaType} from "@/lib/server/utils/enums";
import {ExtractFollowByType} from "@/lib/components/types";
import {DisplayTvRedo} from "@/lib/components/media/tv/DisplayTvRedo";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";
import {DisplayEpsAndSeasons} from "@/lib/components/media/tv/DisplayEpsAndSeasons";


interface TvFollowCardProps {
    rating: React.ReactNode;
    followData: ExtractFollowByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
}


export const TvFollowCard = ({ followData, rating }: TvFollowCardProps) => {
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