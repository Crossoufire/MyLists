import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/components/ui/badge";
import {Separator} from "@/lib/components/ui/separator";
import {Card, CardContent} from "@/lib/components/ui/card";
import {Heart, MessageCircle, Play, RotateCw, Star} from "lucide-react";
import {MediaType, RatingSystemType, Status} from "@/lib/server/utils/enums";
import {getFeelingIcon, getStatusColor, zeroPad} from "@/lib/utils/functions";
import {mediaDetailsOptions} from "@/lib/react-query/query-options/query-options";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";


interface FollowCardProps {
    mediaType: MediaType;
    follow: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["followsData"][0];
}


export const FollowCard = ({ follow, mediaType }: FollowCardProps) => {
    const rating = formatRating();

    function formatRating() {
        if (follow.userMedia.ratingSystem === RatingSystemType.FEELING) {
            return getFeelingIcon(follow.userMedia.rating, { size: 17 });
        }
        return follow.userMedia.rating === null ? "--" : follow.userMedia.rating.toFixed(1);
    }

    const getTextColor = (backColor: string) => {
        const hex = backColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 2 + 2), 16);
        const b = parseInt(hex.substring(4, 4 + 2), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? "#000000" : "#e2e2e2";
    };

    return (
        <Card className="h-full">
            <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                        <Link to="/profile/$username" params={{ username: follow.name }}>
                            <img
                                alt={follow.name}
                                src={follow.image!}
                                className="bg-neutral-600 h-[52px] w-[52px] rounded-full"
                            />
                        </Link>
                    </div>
                    <div className="col-span-9 space-y-1">
                        <Link to="/profile/$username" params={{ username: follow.name }}>
                            <div className="text-lg font-medium">{follow.name}</div>
                        </Link>
                        <div className="flex justify-between items-center pr-3">
                            <div className="flex items-center gap-x-2">
                                <Star size={15} className={cn("text-[e2e2e2]", rating != "--" && "text-amber-500")}/>
                                <div>{rating}</div>
                            </div>
                            <RedoInfo
                                follow={follow}
                                mediaType={mediaType}
                            />
                            <div className="flex items-center gap-x-2">
                                {follow.userMedia.comment ?
                                    <Popover>
                                        <PopoverTrigger>
                                            <MessageCircle size={15} className="text-blue-500"/>
                                        </PopoverTrigger>
                                        <PopoverContent>{follow.userMedia.comment}</PopoverContent>
                                    </Popover>
                                    :
                                    <MessageCircle size={15}/>
                                }
                            </div>
                            <div className="flex gap-x-2">
                                <Heart
                                    size={15}
                                    className={cn("", follow.userMedia.favorite && "text-red-700")}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <Separator className="mb-3 mt-3"/>
                <div className="flex items-center justify-between">
                    <div className="flex gap-x-3">
                        <Badge style={{
                            background: getStatusColor(follow.userMedia.status),
                            color: getTextColor(getStatusColor(follow.userMedia.status)),
                        }}>
                            {follow.userMedia.status}
                        </Badge>
                    </div>
                    <MoreFollowDetails
                        follow={follow}
                        mediaType={mediaType}
                    />
                </div>
            </CardContent>
        </Card>
    );
};


interface RedoInfoProps {
    mediaType: MediaType;
    follow: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["followsData"][0];
}


const RedoInfo = ({ follow, mediaType }: RedoInfoProps) => {
    if (mediaType === "games") {
        return null;
    }
    else if (mediaType == MediaType.SERIES || mediaType == MediaType.ANIME) {
        const maxCount = Math.max(...follow.userMedia.redo2);
        //@ts-expect-error
        const totalRedo = follow.mediaList.redo2.reduce((a, b) => a + b, 0);

        if (maxCount === 0) {
            return (
                <div className="flex items-center gap-x-2">
                    <RotateCw size={15} className="text-green-500"/>
                    <div>{totalRedo} {totalRedo > 1 ? "S." : ""}</div>
                </div>
            );
        }

        return (
            <Popover>
                <PopoverTrigger>
                    <div className="flex items-center gap-x-2">
                        <RotateCw size={15} className="text-green-500"/>
                        <div>{totalRedo} {totalRedo > 1 ? "S." : ""}</div>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-40 px-5 pt-3 pb-3 max-h-[210px] overflow-auto" align="center">
                    <div className=" grid gap-3">
                        <div className="space-y-2">
                            {/*//@ts-expect-error*/}
                            {follow.mediaList.redo2.map((season, idx) => (
                                <div key={idx} className="flex gap-3 items-center justify-between">
                                    <div className="text-sm font-medium leading-none">
                                        Season {zeroPad(idx + 1)}
                                    </div>
                                    <div className="text-sm font-medium">
                                        {season}x
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
    else {
        return (
            <div className="flex items-center gap-x-2">
                <RotateCw size={15} className="text-green-500"/>
                <div>{follow.userMedia.redo}</div>
            </div>
        );
    }
};


interface MoreFollowDetailsProps {
    mediaType: MediaType;
    follow: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["followsData"][0];
}


const MoreFollowDetails = ({ mediaType, follow }: MoreFollowDetailsProps) => {
    if (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) {
        if (![Status.RANDOM, Status.PLAN_TO_WATCH].includes(follow.userMedia.status)) {
            return (
                <div className="flex gap-x-2 items-center">
                    <Play size={16} className="mt-0.5"/>
                    S{zeroPad(follow.userMedia.currentSeason)} - E{zeroPad(follow.userMedia.lastEpisodeWatched)}
                </div>
            );
        }
    }
    else if (mediaType === MediaType.BOOKS && follow.userMedia.status !== Status.PLAN_TO_READ) {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Pages {follow.userMedia.actualPage}/{follow.userMedia.totalPages}
            </div>
        );
    }
    else if (mediaType === MediaType.GAMES && follow.userMedia.status !== Status.PLAN_TO_PLAY) {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Played {follow.userMedia.playtime / 60} h
            </div>
        );
    }
    else if (mediaType === MediaType.MANGA && follow.userMedia.status !== Status.PLAN_TO_READ) {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Chpt. {follow.userMedia.currentChapter}/{follow.userMedia.totalChapters ?? "?"}
            </div>
        );
    }
};
