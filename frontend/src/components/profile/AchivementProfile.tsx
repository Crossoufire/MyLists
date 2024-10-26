import {Link} from "@tanstack/react-router";
import {TierDifficulty} from "@/utils/types";
import {cn, diffColors} from "@/utils/functions";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";
import {LuArrowRight, LuAward} from "react-icons/lu";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const AchievementsDisplay = ({username, achievements}: AchievementsDisplayProps) => {
    const {caret, toggleCollapse, contentClasses} = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="py-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>Achievements</div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className={contentClasses}>
                <AchievementSummary
                    summary={achievements.summary}
                />
                <div className="grid grid-cols-3 gap-4">
                    {achievements.details.length === 0 ?
                        <MutedText className="col-span-3">No achievements gained yet</MutedText>
                        :
                        achievements.details.map((ach, idx) => <AchievementCard key={idx} achievement={ach}/>)
                    }
                </div>
                <Separator className="mt-3"/>
                <div className="flex items-center justify-end">
                    <Link to={`/achievements/${username}`} className="font-medium hover:underline">
                        All achievements<LuArrowRight className="inline-block ml-1"/>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};


function AchievementSummary({summary}: { summary: Array<AchievementSummaryItem> }) {
    const difficulties = ["bronze", "silver", "gold", "platinum"];
    const total = summary.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="flex items-center justify-between font-bold mb-4">
            <div className="flex items-center font-bold gap-4">
                {summary.length === 0 ?
                    difficulties.map((diff, idx) =>
                        <div key={idx} className="flex items-center gap-1">
                            <LuAward className={cn("w-5 h-5", diffColors(diff as TierDifficulty))}/>
                            <span>0</span>
                        </div>
                    )
                    :
                    summary.map((diff, idx) =>
                        <div key={idx} className="flex items-center gap-1">
                            <LuAward className={cn("w-5 h-5", diffColors(diff.difficulty))}/>
                            <span>{diff.count}</span>
                        </div>
                    )
                }
            </div>
            <div>Total: {total}/52</div>
        </div>
    );
}


function AchievementCard({achievement}: { achievement: Achievement }) {
    return (
        <div className="bg-gray-800 p-3 rounded-md">
            <div className="flex items-center gap-1">
                <LuAward className={cn("w-5 h-5", diffColors(achievement.difficulty))}/>
                <div className="text-sm font-semibold truncate w-full">{achievement.name}</div>
            </div>
            <div className="text-xs line-clamp-2 text-muted-foreground">{achievement.description}</div>
        </div>
    );
}


interface AchievementsDisplayProps {
    username: string;
    achievements: {
        summary: Array<AchievementSummaryItem>;
        details: Array<Achievement>;
    };
}


interface Achievement {
    name: string;
    description: string;
    difficulty: TierDifficulty;
}


interface AchievementSummaryItem {
    difficulty: TierDifficulty;
    count: number;
}
