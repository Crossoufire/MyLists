import React from "react";
import {cn} from "@/lib/utils/helpers";
import {getDaysRemaining} from "@/lib/utils/functions";
import {Calendar, Clock, LucideIcon, Star} from "lucide-react";


interface MediaInfoGridItemProps {
    label: string;
    children: React.ReactNode;
}


export const MediaInfoGridItem = ({ label, children }: MediaInfoGridItemProps) => (
    <div className="space-y-1">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
        </span>
        <div className="wrap-break-word text-sm font-medium">
            {children}
        </div>
    </div>
);


interface MediaSectionTitleProps {
    title: string;
    children?: React.ReactNode;
}


export const MediaSectionTitle = ({ children, title }: MediaSectionTitleProps) => {
    return (
        <div className="flex justify-between items-end mb-3">
            <h2 className="text-xl font-semibold text-primary">
                {title}
            </h2>
            <span className="text-sm text-muted-foreground">
                {children}
            </span>
        </div>
    );
};


interface MediaExtraGridProps {
    name: string;
    subname: string;
    initials: string;
    clickable?: boolean;
}


export const MediaExtraGrid = ({ initials, name, subname, clickable = false }: MediaExtraGridProps) => {
    return (
        <div className="group flex items-center gap-3 p-2 rounded-lg bg-popover/30 border hover:bg-popover">
            <div className="size-10 rounded bg-app-accent/20 text-primary flex items-center justify-center
            text-sm font-bold tracking-wider shrink-0">
                {initials}
            </div>
            <div className="min-w-0">
                <p className={cn("text-sm font-medium text-primary truncate", clickable && "group-hover:text-app-accent")}>
                    {name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {subname}
                </p>
            </div>
        </div>
    );
}


interface MediaUnderItemProps {
    icon: LucideIcon;
    children: React.ReactNode;
}


export const MediaUnderItem = ({ icon: Icon, children }: MediaUnderItemProps) => (
    <div className="flex items-center gap-1.5">
        <Icon className="size-4 text-muted-foreground"/>
        <span>{children}</span>
    </div>
);


interface MediaUnderRatingProps {
    divisor?: number;
    voteCount?: number | null;
    voteAverage?: number | null;
}


export const MediaUnderRating = ({ voteAverage, voteCount, divisor = 1 }: MediaUnderRatingProps) => {
    if (!voteAverage) return null;

    return (
        <div className="flex items-center gap-1.5">
            <Star className="size-4 fill-app-rating text-app-rating"/>
            <span className="text-lg text-primary">
                {(voteAverage / divisor).toFixed(1)}
            </span>
            {voteCount &&
                <span className="text-xs text-muted-foreground">
                    ({voteCount.toLocaleString()})
                </span>
            }
        </div>
    );
};


interface UpComingAlertProps {
    title: string;
    dateString: string;
    children?: React.ReactNode;
}


export const UpComingAlert = ({ children, title, dateString }: UpComingAlertProps) => {
    const airDate = new Date(dateString);
    const daysRemaining = getDaysRemaining(dateString);

    return (
        <div className="relative overflow-hidden rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="size-6"/>
                </div>

                <div className="flex-1 space-y-1">
                    <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {children}
                        <Calendar className="size-3.5"/>
                        <span>
                            {daysRemaining === 0 ?
                                "Releasing today"
                                :
                                `In ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`
                            }
                        </span>
                    </div>
                </div>

                <div className="flex min-w-15 flex-col items-center justify-center rounded-md bg-app-accent/20 px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {airDate.toLocaleString("en-US", { month: "short" })}
                    </span>
                    <span className="text-xl font-bold leading-none tabular-nums">
                        {airDate.getDate()}
                    </span>
                </div>
            </div>
        </div>
    );
};
