import React from "react";
import {Heart} from "lucide-react";
import {formatRating} from "@/lib/utils/functions";
import {UserMediaItem} from "@/lib/components/types";
import {DisplayRating} from "@/lib/components/media/base/DisplayRating";
import {DisplayComment} from "@/lib/components/media/base/DisplayComment";


export const CommonInfoTableCell = ({ userMedia }: { userMedia: UserMediaItem }) => {
    const rating = formatRating(userMedia.ratingSystem, userMedia.rating, true);

    return (
        <>
            {rating &&
                <DisplayRating
                    rating={rating}
                />
            }
            {userMedia.favorite &&
                <Heart className="w-4 h-4 text-red-500"/>
            }
            {userMedia.comment &&
                <DisplayComment content={userMedia.comment}/>
            }
        </>
    );
}
