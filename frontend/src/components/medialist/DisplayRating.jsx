import {LuStar} from "react-icons/lu";
import {getFeelingValues} from "@/utils/functions";


export const DisplayRating = ({ rating }) => {
    if (rating.type === "score" && rating.value) {
        return (
            <div className="flex items-center gap-1">
                <LuStar className="text-amber-500"/>
                <span>{rating.value === 10 ? rating.value : rating.value.toFixed(1)}</span>
            </div>
        );
    }
    if (rating.type === "feeling" && rating.value) {
        return getFeelingValues(16).find(f => f.value === rating.value)?.icon;
    }

    return null;
};
