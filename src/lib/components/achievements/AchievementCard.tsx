import {useMemo} from "react";
import {cn} from "@/lib/utils/helpers";
import {Badge} from "@/lib/components/ui/badge";
import {Award, CircleCheck} from "lucide-react";
import {Progress} from "@/lib/components/ui/progress";
import {capitalize, diffColors} from "@/lib/utils/functions";
import {TiersDetails} from "@/lib/components/achievements/TierDetails";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


interface AchievementCardProps {
    achievement: any;
}


export const AchievementCard = ({ achievement }: AchievementCardProps) => {
    const { name, mediType, description, tiers, userData } = achievement;

    const fullyCompleted = useMemo(() => userData.length > 0 && userData.every((tier) => tier.completed), [userData]);
    const userHighestTier = useMemo(() => {
        const completed = userData.filter((tier) => tier.completed);
        return completed.sort((a, b) => b.tier_id - a.tier_id)[0];
    }, [userData]);
    const userNextTier = useMemo(() => {
        const pending = userData.filter((tier) => !tier.completed);
        return pending.sort((a, b) => a.tier_id - b.tier_id)[0];
    }, [userData]);

    const highestTierData = tiers.find((tier) => tier.id === userHighestTier?.tier_id);
    const nextTierData = userNextTier ? tiers.find((tier) => tier.id === userNextTier.tier_id) : tiers[0];

    const iconColorClass = diffColors(highestTierData?.difficulty);
    const borderColorClass = diffColors(highestTierData?.difficulty, "border");

    const currentCount = userNextTier ? userNextTier.count : 0;
    const criteriaCount = userNextTier ? nextTierData.criteria.count : tiers[0].criteria.count;
    const nextTierDifficulty = userNextTier ? nextTierData.difficulty : "bronze";
    const nextTierBgColor = diffColors(nextTierDifficulty, "bg");

    return (
        <Card className={cn("relative px-2 py-1 border-l-8", borderColorClass)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Award className={cn("w-6 h-6", iconColorClass)}/>
                        {name}
                    </CardTitle>
                    <Badge variant="secondary">{capitalize(mediaType)}</Badge>
                </div>
                <CardDescription className="line-clamp-2" title={description}>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="mt-1 space-y-4">
                {!fullyCompleted && (
                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">
                                Next tier - {capitalize(nextTierDifficulty)}
                            </span>
                            <p className={cn("text-sm rounded-md px-1.5 py-0.5", nextTierBgColor)}>
                                {currentCount}/{criteriaCount}
                            </p>
                        </div>
                        <Progress
                            className="w-full"
                            color={userNextTier ? "#bfbfbf" : "bg-neutral-400"}
                            {...(userNextTier ? { value: userNextTier.progress } : {})}
                        />
                    </div>
                )}
                {fullyCompleted && (
                    <div className="flex items-center justify-center gap-2 h-12">
                        <CircleCheck className="w-5 h-5 text-green-500"/>
                        <span className="font-semibold">Achievement Completed!</span>
                    </div>
                )}
                <TiersDetails achievement={achievement}/>
            </CardContent>
        </Card>
    );
};