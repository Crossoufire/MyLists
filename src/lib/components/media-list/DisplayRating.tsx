import {Star} from "lucide-react";
import {getFeelingIcon} from "@/lib/utils/functions";
import {RatingSystemType} from "@/lib/server/utils/enums";


interface DisplayRatingProps {
    rating: number;
    ratingSystem: RatingSystemType;
}


export const DisplayRating = ({ rating, ratingSystem }: DisplayRatingProps) => {
    if (!rating) return null;

    if (ratingSystem === RatingSystemType.SCORE) {
        return (
            <div className="flex items-center gap-1">
                <Star className="text-amber-500 w-4 h-4"/>
                <span>{rating === 10 ? rating : rating.toFixed(1)}</span>
            </div>
        );
    }

    return getFeelingIcon(rating, { size: 16 });
};
