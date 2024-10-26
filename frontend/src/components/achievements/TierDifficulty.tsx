import {LuAward} from "react-icons/lu";
import {TierDifficulty} from "@/utils/types";
import {cn, diffColors} from "@/utils/functions";


export const TiersDifficulty = ({tiers, userData}: TiersDifficultyProps) => {
    const findTier = (tier) => {
        if (userData.length === 0) {
            return "text-gray-700";
        }
        return userData.find(t => t.tier_id === tier.id)?.completed ? diffColors(tier.difficulty) : "text-gray-700";
    };

    return (
        <div className="flex items-center gap-2">
            {tiers.map((tier, idx) => <LuAward key={idx} className={cn("w-6 h-6", findTier(tier))}/>)}
        </div>
    );
};


interface TiersDifficultyProps {
    tiers: Array<{
        id: number;
        difficulty: TierDifficulty;
    }>;
    userData: Array<{
        tier_id: number;
        completed: boolean;
    }>;
}