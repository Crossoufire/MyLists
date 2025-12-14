import {Star, Clock, Heart, Loader2, TriangleIcon, Play, Calendar} from "lucide-react";
import {getAccentClasses} from "@/lib/client/social-card/media.config";
import {MediaTypeConfig, YearInReviewData} from "@/lib/client/social-card/types";
import {cn} from "@/lib/utils/helpers";


interface YearInReviewStatProps {
    isLoading: boolean;
    mediaConfig: MediaTypeConfig;
    data: YearInReviewData | undefined;
}


export function YearInReviewStat({ data, isLoading, mediaConfig }: YearInReviewStatProps) {
    const { terminology } = mediaConfig;
    const currentYear = new Date().getFullYear();
    const accent = getAccentClasses(mediaConfig.id);

    const stats = [
        {
            value: data?.mediaCount ?? "-",
            label: terminology.plural.charAt(0).toUpperCase() + terminology.plural.slice(1),
        },
        {
            value: data?.avgRating ?? "-",
            label: `Avg. ${terminology.ratingLabel}`,
        },
        {
            value: data?.timeSpent ?? "-",
            label: terminology.timeUnit.charAt(0).toUpperCase() + terminology.timeUnit.slice(1),
        },
        {
            label: "Favorites",
            value: data?.favorites ?? "-",
        },
    ];

    return (
        <>
            <div className="flex h-full flex-col p-4">
                <div className="flex justify-center items-center gap-2 mb-1 -mt-1 text-center text-sm text-gray-400">
                    <Calendar className={`size-4 ${accent.text}`}/>
                    {currentYear} in Review
                </div>

                {isLoading ?
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className={`size-8 animate-spin ${accent.text}`}/>
                    </div>
                    :
                    <div className="grid flex-1 grid-cols-4 gap-4 mt-1 -mb-1">
                        {stats.map((stat) =>
                            <div key={stat.label} className="flex flex-col items-center justify-center bg-card rounded-lg">
                                <div className="text-3xl font-bold">
                                    {stat.value}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {stat.label}
                                </div>
                            </div>
                        )}
                    </div>
                }
            </div>
        </>
    );
}
