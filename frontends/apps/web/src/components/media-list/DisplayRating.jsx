import {LuStar} from "react-icons/lu";
import {getFeelingIcon} from "@/utils/functions";


export const DisplayRating = ({ rating }) => {
    if (!rating.value) return null;

    if (rating.type === "score") {
        return (
            <div className="flex items-center gap-1">
                <LuStar className="text-amber-500"/>
                <span>{rating.value === 10 ? rating.value : rating.value.toFixed(1)}</span>
            </div>
        );
    }
    
    return getFeelingIcon(rating.value, { size: 16 });
};
