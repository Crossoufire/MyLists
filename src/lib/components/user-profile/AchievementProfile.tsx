import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {ArrowRight, Award} from "lucide-react";
import {diffColors} from "@/lib/utils/functions";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/general/MutedText";
import {AchievementDifficulty} from "@/lib/server/utils/enums";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";

import {AchievementsType} from "@/lib/components/types";


interface AchievementsProps {
    username: string;
    achievements: AchievementsType;
}


export const AchievementsDisplay = ({ username, achievements }: AchievementsProps) => {
    const { summary, details } = achievements;
    const { caret, toggleCollapse, contentClasses } = useCollapse();

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
                <AchievementSummary summary={summary}/>
                <div className="grid grid-cols-3 gap-4">
                    {details.length === 0 ?
                        <MutedText className="col-span-3">No achievements gained yet</MutedText>
                        :
                        details.map((ach: any, idx: number) => <AchievementCard key={idx} achievement={ach}/>)
                    }
                </div>
                <Separator className="mt-3"/>
                <div className="flex items-center justify-end">
                    <Link to="/achievements/$username" params={{ username }} className="font-medium hover:underline">
                        All Achievements<ArrowRight className="inline-block ml-2 w-4 h-4"/>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};


interface AchievementSummaryProps {
    summary: AchievementsType["summary"];
}


function AchievementSummary({ summary }: AchievementSummaryProps) {
    const total = summary.reduce((acc: any, curr: any) => acc + curr.count, 0);

    return (
        <div className="flex items-center justify-between font-bold mb-4">
            <div className="flex items-center font-bold gap-4">
                {summary.length === 0 ?
                    Object.values(AchievementDifficulty).map((diff, idx) =>
                        <div key={idx} className="flex items-center gap-1">
                            <Award className={cn("w-5 h-5", diffColors(diff))}/>
                            <span>0</span>
                        </div>,
                    )
                    :
                    summary.map((diff: any, idx: number) =>
                        <div key={idx} className="flex items-center gap-1">
                            <Award className={cn("w-5 h-5", diffColors(diff.difficulty))}/>
                            <span>{diff.count}</span>
                        </div>,
                    )
                }
            </div>
            <div>Total: {total}/63</div>
        </div>
    );
}


interface AchievementCardProps {
    achievement: AchievementsType["details"][0];
}


function AchievementCard({ achievement }: AchievementCardProps) {
    return (
        <div className={cn("bg-gray-800 p-3 rounded-md border-l-4", diffColors(achievement.difficulty, "border"))}>
            <div className="flex items-center gap-1">
                <Award className={cn("w-5 h-5", diffColors(achievement.difficulty))}/>
                <div className="text-sm font-semibold truncate w-full">{achievement.name}</div>
            </div>
            <div className="text-xs line-clamp-2 text-muted-foreground">{achievement.description}</div>
        </div>
    );
}