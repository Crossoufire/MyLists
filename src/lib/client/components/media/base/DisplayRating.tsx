import React from "react";
import {Star} from "lucide-react";


interface DisplayRatingProps {
    size?: number;
    rating: string | React.ReactNode;
}


export const DisplayRating = ({ rating, size = 15 }: DisplayRatingProps) => {
    return (
        <div className="flex items-center gap-x-2">
            <Star className="text-amber-500" size={size}/>
            <div>{rating}</div>
        </div>
    );
};
