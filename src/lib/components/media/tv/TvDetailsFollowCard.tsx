import {Play} from "lucide-react";
import {zeroPad} from "@/lib/utils/functions";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {ExtractFollowsByType} from "@/lib/components/types";


interface TvDetailsFollowCardProps {
    follow: ExtractFollowsByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
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