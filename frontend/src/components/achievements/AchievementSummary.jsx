import {LuAward} from "react-icons/lu";
import {diffColors} from "@/utils/functions";
import {Card, CardContent} from "@/components/ui/card";


export const AchievementSummary = ({ summary }) => {
    return (
        <div className="flex gap-4">
            {summary.map(item =>
                <Card className="w-full mb-7">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap justify-center font-medium gap-4">
                            <div key={item.tier} className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <LuAward className={`h-5 w-5 ${diffColors(item.tier)}`}/>
                                    <span className={`${diffColors(item.tier)}`}>{item.tier}</span>
                                </div>
                                <span className={`text-2xl ${diffColors(item.tier)}`}>{item.value}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
