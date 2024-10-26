import {cn} from "@/utils/functions";
import {LuHeart} from "react-icons/lu";
import {UseMutationResult} from "@tanstack/react-query";


export const ManageFavorite = ({updateFavorite, isFavorite}: ManageFavoriteProps) => {
    const handleFavorite = () => {
        updateFavorite.mutate({payload: !isFavorite});
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


interface ManageFavoriteProps {
    isFavorite: boolean;
    updateFavorite: UseMutationResult;
}