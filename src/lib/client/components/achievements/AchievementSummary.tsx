import {Award} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {AchSummary} from "@/lib/types/query.options.types";
import {Card, CardContent} from "@/lib/client/components/ui/card";
import {capitalize, diffColors} from "@/lib/utils/functions";


interface AchievementSummaryProps {
    summary: AchSummary;
}


export const AchievementSummary = ({ summary }: AchievementSummaryProps) => {
    return (
        <div className="grid grid-cols-5 gap-6 w-[80%] mx-auto max-lg:w-[95%] max-sm:grid-cols-3 max-sm:w-full max-sm:gap-2">
            {summary.map((diff) =>
                <Card key={diff.tier}>
                    <CardContent className="p-2 px-0 max-sm:p-0">
                        <div className="flex items-center justify-center font-medium">
                            <div key={diff.tier} className="flex items-center gap-4 max-sm:gap-3">
                                <div className="flex flex-col items-center">
                                    <Award className={cn("size-5 max-sm:size-4", diffColors(diff.tier))}/>
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
