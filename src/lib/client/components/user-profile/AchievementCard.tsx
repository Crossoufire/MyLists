import {Trophy} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {AchievementsType} from "@/lib/types/query.options.types";
import {diffColors, formatRelativeTime} from "@/lib/utils/functions";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {EmptyState} from "./EmptyState";


interface AchievementsProps {
    username: string;
    achievements: AchievementsType;
}


export const AchievementsCard = ({ username, achievements }: AchievementsProps) => {
    return (
        <Card className={cn("h-fit", achievements.details.length === 0 && "h-fit")}>
            <CardHeader>
                <CardTitle>
                    Last Achievements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {achievements.details.length === 0 ?
                        <EmptyState
                            icon={Trophy}
                            message="No achievements earned yet."
                        />
                        :
                        achievements.details.slice(0, 3).map((ach) =>
                            <div key={ach.name} className={`p-2 rounded-lg border ${diffColors(ach.difficulty, "border")}`}>
                                <div className="flex justify-between">
                                    <div className="flex gap-2 items-center mb-1">
                                        <Trophy className={cn("size-4", diffColors(ach.difficulty, "text"))}/>
                                        <div className="font-bold text-sm">
                                            {ach.name}
                                        </div>
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {formatRelativeTime(ach.completedAt)}
                                    </div>
                                </div>
                                <p className="text-xs opacity-80 mt-1">
                                    {ach.description}
                                </p>
                            </div>
                        )
                    }
                </div>
                {achievements.details.length !== 0 &&
                    <Button className="mt-4" variant="dashed" asChild>
                        <Link to="/achievements/$username" params={{ username }}>
                            View all 63 achievements
                        </Link>
                    </Button>
                }
            </CardContent>
        </Card>
    )
}
