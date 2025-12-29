import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {Calendar, Clock} from "lucide-react";
import {CURRENT_DATE, getDaysRemaining} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type MoviesDetailsProps<T extends MediaType> = Parameters<NonNullable<MediaConfig[T]["upComingAlert"]>>[number];


export const MoviesUpComingAlert = ({ media }: MoviesDetailsProps<typeof MediaType.MOVIES>) => {
    if (!media.releaseDate || CURRENT_DATE.getTime() > new Date(media.releaseDate).getTime()) return null;

    const airDate = new Date(media.releaseDate);
    const daysRemaining = getDaysRemaining(media.releaseDate);

    return (
        <div className="relative overflow-hidden rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="size-6"/>
                </div>

                <div className="flex-1 space-y-1">
                    <h3 className="font-semibold leading-none tracking-tight">
                        Movie Premiere
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-3.5"/>
                        <span>
                            {daysRemaining === 0 ?
                                "Releasing today" : `In ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`
                            }
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-md bg-app-accent/20 px-3 py-1.5 min-w-15">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {airDate.toLocaleString("en-US", { month: "short" })}
                    </span>
                    <span className="text-xl font-bold tabular-nums leading-none">
                        {airDate.getDate()}
                    </span>
                </div>
            </div>
        </div>
    );
};
