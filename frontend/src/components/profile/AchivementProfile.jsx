import {Link} from "@tanstack/react-router";
import {cn, diffColors} from "@/utils/functions";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";
import {LuArrowRight, LuAward} from "react-icons/lu";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const AchievementsDisplay = ({ username, achievements: { summary, details } }) => {
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
                <AchievementSummary
                    summary={summary}
                />
                <div className="grid grid-cols-3 gap-4">
                    {details.length === 0 ?
                        <MutedText className="col-span-3">No achievements gained yet</MutedText>
                        :
                        details.map((ach, idx) => <AchievementCard key={idx} achievement={ach}/>)
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


function AchievementSummary({ summary }) {
    const total = summary.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="flex items-center justify-between font-bold mb-4">
            <div className="flex items-center font-bold gap-4">
                {summary.length === 0 ?
                    ["Bronze", "Silver", "Gold", "Platinum"].map((diff, idx) =>
                        <div key={idx} className="flex items-center gap-1">
                            <LuAward className={cn("w-5 h-5", diffColors(diff))}/>
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


function AchievementCard({ achievement }) {
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