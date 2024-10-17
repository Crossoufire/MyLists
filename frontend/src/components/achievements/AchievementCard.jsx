import {useMemo} from "react";
import {Badge} from "@/components/ui/badge";
import {LuAward, LuCheckCircle} from "react-icons/lu";
import {Progress} from "@/components/ui/progress";
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

    const sparkles = useMemo(() => {
        return [...Array(25)].map((_, i) => ({ x: Math.random() * 100, y: Math.random() * 100, delay: i * 0.09 }));
    }, [fullyCompleted]);

    return (
        <div className="relative overflow-hidden rounded-lg">
            <div className={cn("absolute w-full h-full rounded-md", diffColors(highestTierData?.difficulty, true))}/>
            <Card className="relative h-full w-[98%] h-[98%] px-2 py-1">
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
                                <span className="font-medium">Next tier - {nextTierData.difficulty}</span>
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
                {/*{fullyCompleted && sparkles.map((sparkle, i) => <Sparkle key={i} delay={sparkle.delay} x={sparkle.x} y={sparkle.y}/>)}*/}
            </Card>
            {/*{fullyCompleted &&*/}
            {/*    <div className="absolute -inset-full w-[200%] h-[200%]">*/}
            {/*        <div*/}
            {/*            className="absolute top-1/2 left-0 w-full blur h-[50px] -rotate-45 animate-shimmer"*/}
            {/*            style={{ background: `linear-gradient(90deg, transparent, rgba(55, 200, 166, 0.8), transparent)`, opacity: 0.4 }}*/}
            {/*        />*/}
            {/*    </div>*/}
            {/*}*/}
        </div>
    );
};


const Sparkle = ({ delay, x, y, color }) => (
    <svg
        className="absolute w-4 h-4 animate-sparkle"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ top: `${y}%`, left: `${x}%`, animationDelay: `${delay}s`, color: color }}
    >
        <path d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496
        101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925
        75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z" fill="#FFF"/>
    </svg>
);
