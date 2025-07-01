import {Play} from "lucide-react";
import {zeroPad} from "@/lib/utils/functions";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {ExtractFollowsByType, ExtractListByType} from "@/lib/components/types";


interface DisplayEpsAndSeasonsProps {
    userData: ExtractFollowsByType<typeof MediaType.SERIES | typeof MediaType.ANIME>
        | ExtractListByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
}


export const DisplayEpsAndSeasons = ({ userData }: DisplayEpsAndSeasonsProps) => {
    if (userData.userMedia.status === Status.RANDOM || userData.userMedia.status === Status.PLAN_TO_WATCH) {
        return null;
    }

    return (
        <div className="flex gap-x-2 items-center">
            <Play size={16} className="mt-0.5"/>
            S{zeroPad(userData.userMedia.currentSeason)} - E{zeroPad(userData.userMedia.lastEpisodeWatched)}
        </div>
    );
};