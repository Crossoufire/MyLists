import {Link} from "react-router-dom";
import {Separator} from "@/components/ui/separator";
import {getRatingValues, zeroPad} from "@/lib/utils";
import {Card, CardContent} from "@/components/ui/card";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import { FaAlignJustify, FaCommentAlt, FaHeart, FaPlay, FaRedoAlt, FaRegCommentAlt, FaRegHeart, FaStar } from "react-icons/fa";


export const FollowCard = ({ follow, mediaType }) => {
    const formatRating = () => {
        if (follow.add_feeling) {
            return getRatingValues(follow.add_feeling).find(data => data.value === follow.feeling).icon;
        }
        return follow.score === null ? "---" : follow.score;
    };

    return (
        <Card className="h-full">
            <CardContent className="p-3">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                        <Link to={`/profile/${follow.username}`}>
                            <img
                                src={follow.profile_image}
                                className="bg-neutral-600 h-[52px] w-[52px] rounded-full"
                                alt={follow.username}
                            />
                        </Link>
                    </div>
                    <div className="col-span-9 space-y-2">
                        <Link to={`/profile/${follow.username}`}>
                            <div className="text-lg font-medium">{follow.username}</div>
                        </Link>
                        <div className="flex justify-between items-center pr-3">
                            <div className="flex items-center gap-x-2">
                                <FaStar size={15}/>
                                <div>{formatRating()}</div>
                            </div>
                            {(follow.status === "Completed" && mediaType !== "games") &&
                                <div className="flex items-center gap-x-2">
                                    <FaRedoAlt size={15}/> {follow.rewatched}
                                </div>
                            }
                            <div className="flex items-center gap-x-2">
                                {follow.comment ?
                                    <Popover>
                                        <PopoverTrigger>
                                            <FaCommentAlt size={15} className="text-amber-500"/>
                                        </PopoverTrigger>
                                        <PopoverContent>{follow.comment}</PopoverContent>
                                    </Popover>
                                    :
                                    <FaRegCommentAlt size={15}/>
                                }
                            </div>
                            <div className="flex gap-x-2">
                                {follow.favorite ?
                                    <FaHeart size={15} className="text-red-700"/>
                                    :
                                    <FaRegHeart size={15}/>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <Separator/>
                <div>
                    <div className="flex gap-x-3">
                        <FaAlignJustify className="mt-1"/> {follow.status}
                    </div>
                    <MoreFollowDetails
                        mediaType={mediaType}
                        follow={follow}
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
                    <FaPlay size={14} className="mt-1"/>
                    Season {zeroPad(follow.current_season)} - Episode {zeroPad(follow.last_episode_watched)}
                </div>
            );
        }
    }
    else if (mediaType === "books" && follow.status !== "Plan to Read") {
        return (
            <div className="flex gap-x-3 items-center">
                <FaPlay size={14} className="mt-1"/> Page {follow.actual_page}/{follow.total_pages}
            </div>
        );
    }
    else if (mediaType === "games" && follow.status !== "Plan to Play") {
        return (
            <div className="flex gap-x-3 items-center">
                <FaPlay size={14} className="mt-1"/> Played {follow.playtime / 60} h
            </div>
        );
    }
};
