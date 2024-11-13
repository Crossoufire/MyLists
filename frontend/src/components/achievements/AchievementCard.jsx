import {useMemo} from "react";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {LuAward, LuCheckCircle} from "react-icons/lu";
import {capitalize, cn, diffColors} from "@/utils/functions";
import {TiersDetails} from "@/components/achievements/TierDetails";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";


export const AchievementCard = ({ achievement }) => {
    const getUserHighestTier = useMemo(() => (userData) => {
        return userData.filter(tier => tier.completed).sort((a, b) => b.tier_id - a.tier_id)[0];
    }, [achievement]);

    const getUserNextTier = useMemo(() => (userData) => {
        return userData.filter(tier => !tier.completed).sort((a, b) => a.tier_id - b.tier_id)[0];
    }, [achievement]);

    const isFullyCompleted = useMemo(() => (userData) => {
        if (userData.length === 0) return false;
        return userData.every(tier => tier.completed);
    }, [achievement]);

    const fullyCompleted = isFullyCompleted(achievement.user_data);
    const userNextTier = getUserNextTier(achievement.user_data);
    const userHighestTier = getUserHighestTier(achievement.user_data);

    const nextTierData = achievement.tiers.find(tier => tier.id === userNextTier?.tier_id);
    const highestTierData = achievement.tiers.find(tier => tier.id === userHighestTier?.tier_id);

    return (
        <div className="relative overflow-hidden rounded-lg">
            <div className={cn("absolute w-full h-full rounded-md", diffColors(highestTierData?.difficulty, true))}/>
            <Card className="relative h-full w-[99%] h-[99%] px-2 py-1">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <LuAward className={diffColors(highestTierData?.difficulty)}/>
                            {achievement.name}
                        </CardTitle>
                        <Badge variant="secondary">{capitalize(achievement.media_type)}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2" title={achievement.description}>
                        {achievement.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="mt-1 space-y-4">
                    {(!fullyCompleted && userNextTier) &&
                        <div className="mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Next tier - {capitalize(nextTierData.difficulty)}</span>
                                <p className={cn("text-sm rounded-md px-1.5 py-0.5", diffColors(nextTierData?.difficulty, true))}>
                                    {userNextTier.count}/{nextTierData.criteria.count}
                                </p>
                            </div>
                            <Progress className="w-full" color="bg-neutral-400" value={userNextTier.progress}/>
                        </div>
                    }
                    {(!fullyCompleted && !userNextTier) &&
                        <div className="mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Next tier - Bronze</span>
                                <p className={cn("text-sm rounded-md px-1.5 py-0.5", diffColors("Bronze", true))}>
                                    0/{achievement.tiers[0].criteria.count}
                                </p>
                            </div>
                            <Progress className="w-full" color="bg-neutral-400"/>
                        </div>
                    }
                    {fullyCompleted &&
                        <>
                            <div className="flex items-center justify-center gap-2 h-12">
                                <LuCheckCircle className="w-5 h-5 text-green-500"/>
                                <span className="font-semibold">Achievement Completed!</span>
                            </div>
                        </>
                    }
                    <TiersDetails achievement={achievement}/>
                </CardContent>
            </Card>
        </div>
    );
};
