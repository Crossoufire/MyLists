import {Play} from "lucide-react";
import {zeroPad} from "@/lib/utils/functions";
import {Status} from "@/lib/server/utils/enums";


interface DisplayEpsAndSeasonsProps {
    status: Status;
    currentSeason: number;
    currentEpisode: number;
}


export const DisplayEpsAndSeasons = ({ status, currentSeason, currentEpisode }: DisplayEpsAndSeasonsProps) => {
    if (status === Status.RANDOM || status === Status.PLAN_TO_WATCH) {
        return null;
    }

    return (
        <div className="flex gap-x-2 items-center">
            <Play size={16} className="mt-0.5"/>
            S{zeroPad(currentSeason)} - E{zeroPad(currentEpisode)}
        </div>
    );
};