import {Award} from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {capitalize, cn, diffColors} from "@/utils/functions";


export const AchievementSummary = ({ summary }) => {
    return (
        <div className="grid grid-cols-5 gap-6 w-[80%] mx-auto mb-6 max-lg:w-[95%] max-sm:grid-cols-3 max-sm:w-full max-sm:gap-2
        max-sm:mb-4">
            {summary.map(diff =>
                <Card key={diff.tier}>
                    <CardContent className="p-4 max-sm:p-3">
                        <div className="flex items-center justify-center font-medium">
                            <div key={diff.tier} className="flex items-center gap-3 max-sm:gap-2">
                                <div className="flex flex-col items-center">
                                    <Award className={cn("h-5 w-5 max-sm:h-4 max-sm:w-4", diffColors(diff.tier))}/>
                                    <span className={cn("max-sm:text-sm", diffColors(diff.tier))}>
                                        {capitalize(diff.tier)}
                                    </span>
                                </div>
                                <span className={cn("text-2xl max-lg:text-xl max-sm:text-lg", diffColors(diff.tier))}>
                                    {diff.count}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
