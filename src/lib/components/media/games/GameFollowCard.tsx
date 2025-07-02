import {MediaType} from "@/lib/server/utils/enums";
import {ExtractFollowByType} from "@/lib/components/types";
import {DisplayPlaytime} from "@/lib/components/media/games/DisplayPlaytime";
import {BaseMediaFollowCard} from "@/lib/components/media/base/BaseMediaFollowCard";


interface GameFollowCardProps {
    rating: React.ReactNode;
    followData: ExtractFollowByType<typeof MediaType.GAMES>;
}


export const GameFollowCard = ({ followData, rating }: GameFollowCardProps) => {
    return (
        <BaseMediaFollowCard
            rating={rating}
            followData={followData}
            mediaDetailsDisplay={
                <DisplayPlaytime
                    status={followData.userMedia.status}
                    playtime={followData.userMedia.playtime}
                />
            }
        />
    );
};