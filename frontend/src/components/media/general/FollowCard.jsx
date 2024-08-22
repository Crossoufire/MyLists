import {Separator} from "@/components/ui/separator";
import {getFeelingValues, zeroPad} from "@/lib/utils";
import {Card, CardContent} from "@/components/ui/card";
import {Link, useParams} from "@tanstack/react-router";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {LuAlignJustify, LuHeart, LuMessageSquare, LuPlay, LuRotateCw, LuStar} from "react-icons/lu";


export const FollowCard = ({ data }) => {
    const { mediaType } = useParams({ strict: false });

    const formatRating = () => {
        if (data.rating_system === "feeling") {
            return getFeelingValues(17).find(d => d.value === data.media_assoc.rating / 2).icon;
        }
        return data.media_assoc.rating === null ? "--" : data.media_assoc.rating.toFixed(1);
    };

    return (
        <Card className="h-full">
            <CardContent className="p-3">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                        <Link to={`/profile/${data.username}`}>
                            <img
                                alt={data.username}
                                src={data.profile_cover}
                                className="bg-neutral-600 h-[52px] w-[52px] rounded-full"
                            />
                        </Link>
                    </div>
                    <div className="col-span-9 space-y-2">
                        <Link to={`/profile/${data.username}`}>
                            <div className="text-lg font-medium">{data.username}</div>
                        </Link>
                        <div className="flex justify-between items-center pr-3">
                            <div className="flex items-center gap-x-2">
                                <LuStar size={15}/>
                                <div>{formatRating()}</div>
                            </div>
                            {(data.media_assoc.status === "Completed" && mediaType !== "games") &&
                                <div className="flex items-center gap-x-2">
                                    <LuRotateCw size={15}/> {data.media_assoc.redo}
                                </div>
                            }
                            <div className="flex items-center gap-x-2">
                                {data.media_assoc.comment ?
                                    <Popover>
                                        <PopoverTrigger>
                                            <LuMessageSquare size={15} className="text-amber-500"/>
                                        </PopoverTrigger>
                                        <PopoverContent>{data.media_assoc.comment}</PopoverContent>
                                    </Popover>
                                    :
                                    <LuMessageSquare size={15}/>
                                }
                            </div>
                            <div className="flex gap-x-2">
                                <LuHeart size={15} className={data.media_assoc.favorite && "text-red-700"}/>
                            </div>
                        </div>
                    </div>
                </div>
                <Separator/>
                <div>
                    <div className="flex gap-x-3">
                        <LuAlignJustify className="mt-1"/> {data.media_assoc.status}
                    </div>
                    <MoreFollowDetails
                        mediaType={mediaType}
                        mediaAssoc={data.media_assoc}
                    />
                </div>
            </CardContent>
        </Card>
    );
};


const MoreFollowDetails = ({ mediaType, mediaAssoc }) => {
    if (mediaType === "series" || mediaType === "anime") {
        if (!["Random", "Plan to Watch"].includes(mediaAssoc.status)) {
            return (
                <div className="flex gap-x-3 items-center">
                    <LuPlay size={16} className="mt-1"/>
                    Season {zeroPad(mediaAssoc.current_season)} - Episode {zeroPad(mediaAssoc.current_episode)}
                </div>
            );
        }
    }
    else if (mediaType === "books" && mediaAssoc.status !== "Plan to Read") {
        return (
            <div className="flex gap-x-3 items-center">
                <LuPlay size={16} className="mt-1"/> Page {mediaAssoc.current_page}/{mediaAssoc.pages}
            </div>
        );
    }
    else if (mediaType === "games" && mediaAssoc.status !== "Plan to Play") {
        return (
            <div className="flex gap-x-3 items-center">
                <LuPlay size={16} className="mt-1"/> Played {mediaAssoc.current_playtime / 60} h
            </div>
        );
    }
};
