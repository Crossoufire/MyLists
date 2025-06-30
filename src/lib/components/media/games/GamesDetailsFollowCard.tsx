import {Play} from "lucide-react";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {ExtractFollowsByType} from "@/lib/components/types";


interface GamesDetailsFollowCardProps {
    follow: ExtractFollowsByType<typeof MediaType.GAMES>;
}


export const GamesDetailsFollowCard = ({ follow }: GamesDetailsFollowCardProps) => {
    const playtime = follow.userMedia.playtime;

    if (follow.userMedia.status === Status.PLAN_TO_PLAY) {
        return null;
    }

    return (
        <div className="flex gap-x-2 items-center">
            <Play size={16} className="mt-0.5"/>
            Played {playtime ? playtime / 60 : "--"} h
        </div>
    );
};