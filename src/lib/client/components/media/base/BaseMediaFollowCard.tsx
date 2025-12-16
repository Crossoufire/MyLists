import React from "react";
import {MessageCircle} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/client/components/ui/badge";
import {FollowData} from "@/lib/types/query.options.types";
import {Separator} from "@/lib/client/components/ui/separator";
import {Card, CardContent} from "@/lib/client/components/ui/card";
import {getStatusColor, getTextColor} from "@/lib/utils/functions";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {DisplayRating} from "@/lib/client/components/media/base/DisplayRating";
import {DisplayComment} from "@/lib/client/components/media/base/DisplayComment";
import {DisplayFavorite} from "@/lib/client/components/media/base/DisplayFavorite";


interface BaseMediaFollowCardrops {
    followData: FollowData;
    rating: React.ReactNode;
    redoDisplay?: React.ReactNode;
    mediaDetailsDisplay?: React.ReactNode;
}


export const BaseMediaFollowCard = ({ followData, rating, redoDisplay, mediaDetailsDisplay }: BaseMediaFollowCardrops) => {
    return (
        <Card className="h-full">
            <CardContent className="px-3">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                        <Link to="/profile/$username" params={{ username: followData.name }}>
                            <ProfileIcon
                                fallbackSize="text-lg"
                                className="size-13 border-2"
                                user={{ image: followData.image, name: followData.name }}
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