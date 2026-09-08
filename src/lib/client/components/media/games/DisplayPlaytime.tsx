import {Status} from "@/lib/utils/enums";
import {canShowProgress} from "@/lib/utils/media/status";
import {DEFAULT_DASH_FALLBACK} from "@/lib/utils/constants";
import {toActivityDisplayValue} from "@/lib/utils/media/activity";
import {gamesDefinition} from "@/lib/media-definitions/games/games.definition";


interface DisplayPlaytimeProps {
    status: Status;
    playtime: number | null;
}


export const DisplayPlaytime = ({ playtime, status }: DisplayPlaytimeProps) => {
    if (!canShowProgress(status)) {
        return null;
    }

    const displayValue = playtime
        ? toActivityDisplayValue(gamesDefinition.identity.mediaType, playtime)
        : DEFAULT_DASH_FALLBACK;

    return (
        <div className="flex gap-x-1 items-center">
            {displayValue} {gamesDefinition.statistics.durationDistribution.unit}
        </div>
    );
};
