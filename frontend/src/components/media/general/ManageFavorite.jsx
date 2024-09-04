import {cn} from "@/utils/functions";
import {LuHeart} from "react-icons/lu";


export const ManageFavorite = ({ updateFavorite, isFavorite, isCurrent = true }) => {
    const handleFavorite = async () => {
        updateFavorite.mutate({ payload: !isFavorite });
    };

    return (
        <>
            {isCurrent ?
                <div role="button" onClick={handleFavorite}>
                    <LuHeart className={cn("opacity-100", isFavorite && "text-red-700",
                    updateFavorite.isPending && "opacity-20")} title="Favorite"/>
                </div>
                :
                <span><LuHeart className={isFavorite && "text-red-700"} title="Favorite"/></span>
            }
        </>
    );
};