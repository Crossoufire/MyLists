import {Link} from "@tanstack/react-router";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent} from "@/components/ui/card";
import {getFeelingValues, zeroPad} from "@/utils/functions.jsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {LuAlignJustify, LuHeart, LuMessageSquare, LuPlay, LuRotateCw, LuStar} from "react-icons/lu";


export const FollowCard = ({ follow, mediaType }) => {
    const formatRating = () => {
        if (follow.rating.type === "feeling") {
            return getFeelingValues(17).find(data => data.value === follow.rating.value).icon;
        }
        return follow.rating.value === null ? "--" : follow.rating.value.toFixed(1);
    };

    return (
        <Card className="h-full">
            <CardContent className="p-3">
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
                    <div className="col-span-9 space-y-2">
                        <Link to={`/profile/${follow.username}`}>
                            <div className="text-lg font-medium">{follow.username}</div>
                        </Link>
                        <div className="flex justify-between items-center pr-3">
                            <div className="flex items-center gap-x-2">
                                <LuStar size={15}/>
                                <div>{formatRating()}</div>
                            </div>
                            {(follow.status === "Completed" && mediaType !== "games") &&
                                <div className="flex items-center gap-x-2">
                                    <LuRotateCw size={15}/> {follow.redo}
                                </div>
                            }
                            <div className="flex items-center gap-x-2">
                                {follow.comment ?
                                    <Popover>
                                        <PopoverTrigger>
                                            <LuMessageSquare size={15} className="text-amber-500"/>
                                        </PopoverTrigger>
                                        <PopoverContent>{follow.comment}</PopoverContent>
                                    </Popover>
                                    :
                                    <LuMessageSquare size={15}/>
                                }
                            </div>
                            <div className="flex gap-x-2">
                                <LuHeart size={15} className={follow.favorite && "text-red-700"}/>
                            </div>
                        </div>
                    </div>
                </div>
                <Separator/>
                <div>
                    <div className="flex gap-x-3">
                        <LuAlignJustify className="mt-1"/> {follow.status}
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


const MoreFollowDetails = ({ mediaType, follow }) => {
    if (mediaType === "series" || mediaType === "anime") {
        if (!["Random", "Plan to Watch"].includes(follow.status)) {
            return (
                <div className="flex gap-x-3 items-center">
                    <LuPlay size={16} className="mt-1"/>
                    Season {zeroPad(follow.current_season)} - Episode {zeroPad(follow.last_episode_watched)}
                </div>
            );
        }
    }
    else if (mediaType === "books" && follow.status !== "Plan to Read") {
        return (
            <div className="flex gap-x-3 items-center">
                <LuPlay size={16} className="mt-1"/> Pages {follow.actual_page}/{follow.total_pages}
            </div>
        );
    }
    else if (mediaType === "games" && follow.status !== "Plan to Play") {
        return (
            <div className="flex gap-x-3 items-center">
                <LuPlay size={16} className="mt-1"/> Played {follow.playtime / 60} h
            </div>
        );
    }
};
