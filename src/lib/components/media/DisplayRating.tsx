import React from "react";
import {Star} from "lucide-react";
import {cn} from "@/lib/utils/helpers";


interface DisplayRatingProps {
    rating: string | React.ReactNode;
}


export const DisplayRating = ({ rating }: DisplayRatingProps) => {
    return (
        <div className="flex items-center gap-x-2">
            <Star size={15} className={cn("text-gray-400", rating !== "--" && "text-amber-500")}/>
            <div>{rating}</div>
        </div>
    );
};
