import {useMemo} from "react";
import {cn} from "@/lib/utils/helpers";
import {AchCard} from "@/lib/types/query.options.types";
import {Badge} from "@/lib/components/ui/badge";
import {Award, CircleCheck} from "lucide-react";
import {Progress} from "@/lib/components/ui/progress";
import {capitalize, diffColors} from "@/lib/utils/functions";
import {AchievementDifficulty} from "@/lib/server/utils/enums";
import {TiersDetails} from "@/lib/components/achievements/TierDetails";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/components/ui/card";


interface AchievementCardProps {
    achievement: AchCard;
}


export const AchievementCard = ({ achievement }: AchievementCardProps) => {
    const { name, mediaType, description, tiers } = achievement;

    const fullyCompleted = useMemo(() => tiers.length > 0 && tiers.every((tier) => tier.completed), [tiers]);

    const highestCompletedTier = useMemo(() => {
        const completed = tiers.filter((tier) => tier.completed);
        return completed.length > 0 ? completed[completed.length - 1] : undefined;
    }, [tiers]);

    const nextTier = useMemo(() => {
        if (fullyCompleted) return undefined;
        return tiers.find((tier) => !tier.completed);
    }, [tiers, fullyCompleted]);

    const displayDifficulty = highestCompletedTier?.difficulty ?? tiers[0]?.difficulty ?? AchievementDifficulty.BRONZE;
    const iconColorClass = diffColors(displayDifficulty);
    const borderColorClass = diffColors(displayDifficulty, "border");
    const tierForProgressDisplay = nextTier ?? tiers[0];
    const currentCount = tierForProgressDisplay?.count ?? 0;
    const criteriaCount = tierForProgressDisplay?.criteria.count ?? 0;
    const nextTierDifficulty = tierForProgressDisplay?.difficulty ?? AchievementDifficulty.BRONZE;
    const nextTierBgColor = diffColors(nextTierDifficulty, "bg");
    const progressValue = tierForProgressDisplay?.progress ?? 0;

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
                {description && (
                    <CardDescription className="line-clamp-2" title={description}>
                        {description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="mt-1 space-y-4">
                {!fullyCompleted && tierForProgressDisplay && (
                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">
                                Next tier - {capitalize(nextTierDifficulty)}
                            </span>
                            <p className={cn("text-sm rounded-md px-1.5 py-0.5", nextTierBgColor)}>
                                {currentCount}/{criteriaCount}
                            </p>
                        </div>
                        <Progress className="w-full" value={progressValue}/>
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