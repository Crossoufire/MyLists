import React from "react";
import {Link} from "@tanstack/react-router";
import {FollowData} from "@/lib/types/query.options.types";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {StatusBadge} from "@/lib/client/components/general/StatusBadge";
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
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="shrink-0">
                <div className="flex items-center justify-center">
                    <Link to="/profile/$username" params={{ username: followData.name }}>
                        <ProfileIcon
                            fallbackSize="text-lg"
                            className="size-10  border-2"
                            user={{ image: followData.image, name: followData.name }}
                        />
                    </Link>
                </div>
            </div>
            <div className="grow min-w-0">
                <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-primary truncate">
                        <Link to="/profile/$username" params={{ username: followData.name }}>
                            {followData.name}
                        </Link>
                    </p>
                    <StatusBadge
                        status={followData.userMedia.status}
                    />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    <span className="item">
                        {mediaDetailsDisplay}
                    </span>

                    <span className="item">
                        <DisplayRating
                            rating={rating}
                        />
                    </span>

                    <span className="item">
                        {redoDisplay}
                    </span>

                    <span className="item">
                        {followData.userMedia.comment &&
                            <DisplayComment
                                content={followData.userMedia.comment}
                            />
                        }
                    </span>

                    <span className="item">
                        {!!followData.userMedia.favorite &&
                            <DisplayFavorite
                                isFavorite={!!followData.userMedia.favorite}
                            />
                        }
                    </span>
                </div>
            </div>
        </div>
    );
};
