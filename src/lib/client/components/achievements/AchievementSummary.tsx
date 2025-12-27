import {Award} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {AchSummary} from "@/lib/types/query.options.types";
import {capitalize, diffColors} from "@/lib/utils/functions";
import {ProfileStatCard} from "@/lib/client/components/user-profile/ProfileStatCard";


interface AchievementSummaryProps {
    summary: AchSummary;
}


export const AchievementSummary = ({ summary }: AchievementSummaryProps) => {
    return (
        <div className="grid grid-cols-5 gap-6 w-[80%] mx-auto max-lg:w-[95%] max-sm:grid-cols-3 max-sm:w-full max-sm:gap-2">
            {summary.map((diff) =>
                <ProfileStatCard
                    key={diff.tier}
                    value={diff.count}
                    title={capitalize(diff.tier)!}
                    className={diffColors(diff.tier, "border") ?? "border-muted-foreground"}
                    icon={<Award className={cn("mt-1 size-6", diffColors(diff.tier))}/>}
                />
            )}
        </div>
    );
};
