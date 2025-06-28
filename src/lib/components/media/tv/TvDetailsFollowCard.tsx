import {Play} from "lucide-react";
import {zeroPad} from "@/lib/utils/functions";
import {Status} from "@/lib/server/utils/enums";
import {FollowsData} from "@/lib/components/media-details/FollowCard";


interface TvDetailsFollowCardProps {
    follow: Extract<FollowsData[0], { userMedia: { currentSeason: number } }>;
}


export const TvDetailsFollowCard = ({ follow }: TvDetailsFollowCardProps) => {
    if (follow.userMedia.status === Status.RANDOM || follow.userMedia.status === Status.PLAN_TO_WATCH) {
        return null;
    }

    return (
        <div className="flex gap-x-2 items-center">
            <Play size={16} className="mt-0.5"/>
            S{zeroPad(follow.userMedia.currentSeason)} - E{zeroPad(follow.userMedia.lastEpisodeWatched)}
        </div>
    );
};