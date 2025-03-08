import {Link} from "@tanstack/react-router";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent} from "@/components/ui/card";
import {Heart, MessageCircle, Play, RotateCw, Star} from "lucide-react";
import {getFeelingIcon, getStatusColor, zeroPad} from "@/utils/functions";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const FollowCard = ({ follow, mediaType }) => {
    const formatRating = () => {
        if (follow.rating.type === "feeling") {
            return getFeelingIcon(follow.rating.value, { size: 17 });
        }
        return follow.rating.value === null ? "--" : follow.rating.value.toFixed(1);
    };

    const getTextColor = (backColor) => {
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
                        <Link to={`/profile/${follow.username}`}>
                            <img
                                alt={follow.username}
                                src={follow.profile_image}
                                className="bg-neutral-600 h-[52px] w-[52px] rounded-full"
                            />
                        </Link>
                    </div>
                    <div className="col-span-9 space-y-1">
                        <Link to={`/profile/${follow.username}`}>
                            <div className="text-lg font-medium">{follow.username}</div>
                        </Link>
                        <div className="flex justify-between items-center pr-3">
                            <div className="flex items-center gap-x-2">
                                <Star size={15} className="text-amber-500"/>
                                <div>{formatRating()}</div>
                            </div>
                            <RedoInfo
                                follow={follow}
                                mediaType={mediaType}
                            />
                            <div className="flex items-center gap-x-2">
                                {follow.comment ?
                                    <Popover>
                                        <PopoverTrigger>
                                            <MessageCircle size={15} className="text-blue-500"/>
                                        </PopoverTrigger>
                                        <PopoverContent>{follow.comment}</PopoverContent>
                                    </Popover>
                                    :
                                    <MessageCircle size={15}/>
                                }
                            </div>
                            <div className="flex gap-x-2">
                                <Heart size={15} className={follow.favorite && "text-red-700"}/>
                            </div>
                        </div>
                    </div>
                </div>
                <Separator className="mb-3 mt-3"/>
                <div className="flex items-center justify-between">
                    <div className="flex gap-x-3">
                        <Badge style={{ background: getStatusColor(follow.status), color: getTextColor(getStatusColor(follow.status)) }}>
                            {follow.status}
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


const RedoInfo = ({ follow, mediaType }) => {
    if (mediaType === "games") {
        return null;
    }
    else if (["series", "anime"].includes(mediaType)) {
        const maxCount = Math.max(...follow.redo2);
        const totalRedo = follow.redo2.reduce((a, b) => a + b, 0);

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
                            {follow.redo2.map((season, idx) => (
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
                <div>{follow.redo}</div>
            </div>
        );
    }
};


const MoreFollowDetails = ({ mediaType, follow }) => {
    if (mediaType === "series" || mediaType === "anime") {
        if (!["Random", "Plan to Watch"].includes(follow.status)) {
            return (
                <div className="flex gap-x-2 items-center">
                    <Play size={16} className="mt-0.5"/>
                    S{zeroPad(follow.current_season)} - E{zeroPad(follow.last_episode_watched)}
                </div>
            );
        }
    }
    else if (mediaType === "books" && follow.status !== "Plan to Read") {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Pages {follow.actual_page}/{follow.total_pages}
            </div>
        );
    }
    else if (mediaType === "games" && follow.status !== "Plan to Play") {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Played {follow.playtime / 60} h
            </div>
        );
    }
    else if (mediaType === "manga" && follow.status !== "Plan to Read") {
        return (
            <div className="flex gap-x-2 items-center">
                <Play size={16} className="mt-0.5"/> Chpt. {follow.current_chapter}/{follow?.total_chapters ?? "?"}
            </div>
        );
    }
};
