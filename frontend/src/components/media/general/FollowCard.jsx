import {Link} from "react-router-dom";
import {getRatingValues} from "@/lib/utils";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent} from "@/components/ui/card";
import {MoreFollowDetails} from "@/components/media/general/MoreFollowDetails";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {FaAlignJustify, FaCommentAlt, FaHeart, FaRedoAlt, FaRegCommentAlt, FaRegHeart, FaStar} from "react-icons/fa";


export const FollowCard = ({ follow, mediaType }) => {
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
                                <div>
                                    {follow.add_feeling ?
                                        (follow.feeling === -1 || follow.feeling === null) ?
                                            "---" :
                                            <>{getRatingValues(follow.add_feeling).slice(1)[follow.feeling].icon}</>
                                        :
                                        (follow.score === -1 || follow.score === null) ?
                                            "---" : <>{follow.score}</>
                                    }
                                </div>
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