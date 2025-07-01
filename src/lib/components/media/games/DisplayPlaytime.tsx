import {Play} from "lucide-react";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {ExtractFollowsByType, ExtractListByType} from "@/lib/components/types";


interface DisplayPlaytimeProps {
    userData: ExtractFollowsByType<typeof MediaType.GAMES> | ExtractListByType<typeof MediaType.GAMES>;
}


export const DisplayPlaytime = ({ userData }: DisplayPlaytimeProps) => {
    const playtime = userData.userMedia.playtime;

    if (userData.userMedia.status === Status.PLAN_TO_PLAY) {
        return null;
    }

    return (
        <div className="flex gap-x-2 items-center">
            <Play size={16} className="mt-0.5"/>
            Played {playtime ? playtime / 60 : "--"} h
        </div>
    );
};