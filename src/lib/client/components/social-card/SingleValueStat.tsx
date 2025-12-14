import {Loader2} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import type {LucideIcon} from "lucide-react";
import {getAccentClasses} from "@/lib/client/social-card/media.config";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "../ui/card";
import {LayoutSize, MediaTypeConfig, Timeframe} from "@/lib/client/social-card/types";


interface SingleValueStatProps {
    label: string;
    icon: LucideIcon;
    subLabel?: string;
    isLoading: boolean;
    layout: LayoutSize;
    timeframe: Timeframe;
    mediaConfig: MediaTypeConfig;
    value: number | string | undefined;
}


export function SingleValueStat(props: SingleValueStatProps) {
    const { value, label, icon: Icon, isLoading, timeframe, mediaConfig, layout, subLabel } = props;

    const currentYear = new Date().getFullYear();
    const accent = getAccentClasses(mediaConfig.id);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-4">
                <Loader2 className={cn("size-8 animate-spin", accent.text)}/>
            </div>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex gap-2 text-xs uppercase text-gray-400">
                    <Icon className={cn("size-4", accent.text)}/> {label}
                </CardTitle>
                <CardAction className="flex gap-2 text-xs uppercase text-gray-400">
                    {timeframe === "year" ? currentYear : ""}
                </CardAction>
            </CardHeader>
            <CardContent className="-mt-1">
                <div className="text-3xl font-bold">
                    {value ?? "-"}
                </div>
                {subLabel &&
                    <div className="mt-1 text-xs text-gray-400">
                        {subLabel}
                    </div>
                }
            </CardContent>
        </Card>
    );
}