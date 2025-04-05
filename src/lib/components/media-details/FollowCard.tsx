import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/components/ui/badge";
import {MediaType} from "@/lib/server/utils/enums";
import {Separator} from "@/lib/components/ui/separator";
import {Card, CardContent} from "@/lib/components/ui/card";
import {mediaDetailsOptions} from "@/lib/react-query/query-options";
import {Heart, MessageCircle, Play, RotateCw, Star} from "lucide-react";
import {getStatusColor, zeroPad} from "@/lib/utils/functions";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";


interface FollowCardProps {
    mediaType: MediaType;
    follow: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["followsData"][0];
}


export const FollowCard = ({ follow, mediaType }: FollowCardProps) => {

    // TODO: add rating to follow and user
    const formatRating = () => {
        // if (follow.rating.type === "feeling") {
        //     return getFeelingIcon(follow.rating.value, { size: 17 });
        // }
        // return follow.rating.value === null ? "--" : follow.rating.value.toFixed(1);
    };

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
                                <Star size={15} className="text-amber-500"/>
                                {/*<div>{formatRating()}</div>*/}
                            </div>
                            <RedoInfo
                                follow={follow}
                                mediaType={mediaType}
                            />
                            <div className="flex items-center gap-x-2">
                                {follow.mediaList.comment ?
                                    <Popover>
                                        <PopoverTrigger>
                                            <MessageCircle size={15} className="text-blue-500"/>
                                        </PopoverTrigger>
                                        <PopoverContent>{follow.mediaList.comment}</PopoverContent>
                                    </Popover>
                                    :
                                    <MessageCircle size={15}/>
                                }
                            </div>
                            <div className="flex gap-x-2">
                                <Heart
                                    size={15}
                                    className={cn("", follow.mediaList.favorite && "text-red-700")}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <Separator className="mb-3 mt-3"/>
                <div className="flex items-center justify-between">
                    <div className="flex gap-x-3">
                        <Badge style={{
                            background: getStatusColor(follow.mediaList.status),
                            color: getTextColor(getStatusColor(follow.mediaList.status))
                        }}>
                            {follow.mediaList.status}
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
    else if (["series", "anime"].includes(mediaType)) {
        const maxCount = Math.max(...follow.mediaList.redo2);
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
                <div>{follow.mediaList.redo}</div>
            </div>
        );
    }
};


interface MoreFollowDetailsProps {
    mediaType: MediaType;
    follow: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["followsData"][0];
}


const MoreFollowDetails = ({ mediaType, follow }: MoreFollowDetailsProps) => {
    if (mediaType === "series" || mediaType === "anime") {
        if (!["Random", "Plan to Watch"].includes(follow.mediaList.status)) {
            return (
                <div className="flex gap-x-2 items-center">
                    <Play size={16} className="mt-0.5"/>
                    S{zeroPad(follow.mediaList.currentSeason)} - E{zeroPad(follow.mediaList.lastEpisodeWatched)}
                </div>
            );
        }
    }
    else if (mediaType === "books" && follow.mediaList.status !== "Plan to Read") {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Pages {follow.mediaList.actualPage}/{follow.mediaList.totalPages}
            </div>
        );
    }
    else if (mediaType === "games" && follow.mediaList.status !== "Plan to Play") {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Played {follow.mediaList.playtime / 60} h
            </div>
        );
    }
    else if (mediaType === "manga" && follow.mediaList.status !== "Plan to Read") {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Chpt. {follow.mediaList.currentChapter}/{follow?.mediaList.totalChapters ?? "?"}
            </div>
        );
    }
};
