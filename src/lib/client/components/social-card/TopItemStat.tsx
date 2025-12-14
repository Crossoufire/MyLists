import {cn} from "@/lib/utils/helpers";
import type {LucideIcon} from "lucide-react";
import {getAccentClasses} from "@/lib/client/social-card/media.config";
import {LayoutSize, MediaTypeConfig, Timeframe, TopItemData} from "@/lib/client/social-card/types";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface TopItemStatProps {
    label: string;
    icon: LucideIcon;
    layout: LayoutSize;
    timeframe: Timeframe;
    countSuffix?: string;
    mediaConfig: MediaTypeConfig;
    data: TopItemData | undefined;
}


export function TopItemStat(props: TopItemStatProps) {
    const { data, label, icon: Icon, timeframe, mediaConfig, layout, countSuffix } = props;

    const currentYear = new Date().getFullYear();
    const accent = getAccentClasses(mediaConfig.id);
    const suffix = countSuffix ?? mediaConfig.terminology.plural;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex gap-2 text-xs uppercase text-gray-400">
                    <Icon className={cn("size-4", accent.text)}/>
                    {label}
                </CardTitle>
                <CardAction className="flex gap-2 text-xs uppercase text-gray-400">
                    {timeframe === "year" ? currentYear : ""}
                </CardAction>
            </CardHeader>
            <CardContent className="-mt-1">
                <div className="text-3xl font-bold">
                    {data?.name ?? "-"}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                    {data?.count ?? "-"} {suffix}
                </div>
            </CardContent>
        </Card>
    );
}