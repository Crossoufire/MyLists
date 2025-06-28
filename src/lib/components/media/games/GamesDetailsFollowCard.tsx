import {Play} from "lucide-react";
import {Status} from "@/lib/server/utils/enums";
import {FollowsData} from "@/lib/components/media/FollowCard";


interface GamesDetailsFollowCardProps {
    follow: Extract<FollowsData[0], { userMedia: { playtime: number | null } }>;
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