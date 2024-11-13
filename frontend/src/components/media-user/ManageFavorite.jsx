import {cn} from "@/utils/functions";
import {LuHeart} from "react-icons/lu";


export const ManageFavorite = ({ updateFavorite, isFavorite }) => {
    const handleFavorite = () => {
        updateFavorite.mutate({ payload: !isFavorite });
    };

    return (
        <div role="button" onClick={handleFavorite}>
            <LuHeart
                title="Favorite"
                className={cn(
                    "opacity-100 w-5 h-5 text-white",
                    isFavorite && "text-red-700",
                    updateFavorite.isPending && "opacity-20"
                )}
            />
        </div>
    );
};