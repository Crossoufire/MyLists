import {MessageCircle} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/components/ui/badge";
import {FollowData} from "@/lib/types/query.options.types";
import {Separator} from "@/lib/components/ui/separator";
import {Card, CardContent} from "@/lib/components/ui/card";
import {getStatusColor, getTextColor} from "@/lib/utils/functions";
import {DisplayRating} from "@/lib/components/media/base/DisplayRating";
import {DisplayComment} from "@/lib/components/media/base/DisplayComment";
import {DisplayFavorite} from "@/lib/components/media/base/DisplayFavorite";


interface BaseMediaFollowCardrops {
    followData: FollowData;
    rating: React.ReactNode;
    redoDisplay?: React.ReactNode;
    mediaDetailsDisplay?: React.ReactNode;
}


export const BaseMediaFollowCard = ({ followData, rating, redoDisplay, mediaDetailsDisplay }: BaseMediaFollowCardrops) => {
    return (
        <Card className="h-full">
            <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                        <Link to="/profile/$username" params={{ username: followData.name }}>
                            <img
                                alt={followData.name}
                                src={followData.image}
                                className="h-[52px] w-[52px] rounded-full bg-neutral-600"
                            />
                        </Link>
                    </div>
                    <div className="col-span-9 space-y-1">
                        <Link to="/profile/$username" params={{ username: followData.name }}>
                            <div className="text-lg font-medium">
                                {followData.name}
                            </div>
                        </Link>
                        <div className="flex items-center justify-between pr-3">
                            <DisplayRating
                                rating={rating}
                            />
                            {redoDisplay}
                            <div className="flex items-center gap-x-2">
                                {followData.userMedia.comment ?
                                    <DisplayComment content={followData.userMedia.comment}/>
                                    :
                                    <MessageCircle size={15}/>
                                }
                            </div>
                            <DisplayFavorite
                                isFavorite={!!followData.userMedia.favorite}
                            />
                        </div>
                    </div>
                </div>
                <Separator className="mb-3 mt-3"/>
                <div className="flex items-center justify-between">
                    <Badge
                        style={{
                            background: getStatusColor(followData.userMedia.status),
                            color: getTextColor(getStatusColor(followData.userMedia.status)),
                        }}
                    >
                        {followData.userMedia.status}
                    </Badge>
                    {mediaDetailsDisplay}
                </div>
            </CardContent>
        </Card>
    );
};