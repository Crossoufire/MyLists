import {Award} from "lucide-react";
import {cn, diffColors} from "@/utils/functions";


export const TiersDifficulty = ({ tiers, userData }) => {
    const findTier = (tier) => {
        if (userData.length === 0) {
            return "text-gray-700";
        }
        return userData.find(t => t.tier_id === tier.id)?.completed ? diffColors(tier.difficulty) : "text-gray-700";
    };

    return (
        <div className="flex items-center gap-2">
            {tiers.map((tier, idx) => <Award key={idx} className={cn("w-6 h-6", findTier(tier))}/>)}
        </div>
    );
};