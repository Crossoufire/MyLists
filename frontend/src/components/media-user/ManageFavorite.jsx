import {Heart} from "lucide-react";
import {cn} from "@/utils/functions";


export const ManageFavorite = ({ updateFavorite, isFavorite }) => {
    const handleFavorite = () => {
        updateFavorite.mutate({ payload: !isFavorite });
    };

    return (
        <div role="button" onClick={handleFavorite}>
            <Heart
                title="Favorite"
                className={cn("opacity-100 w-5 h-5 text-white", isFavorite && "text-red-700", updateFavorite.isPending && "opacity-20")}
            />
        </div>
    );
};