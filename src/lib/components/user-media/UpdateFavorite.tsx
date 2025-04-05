import {Heart} from "lucide-react";
import {cn} from "@/lib/utils/helpers";


interface UpdateFavoriteProps {
    updateFavorite?: any;
    isFavorite: boolean | undefined | null;
}


export const UpdateFavorite = ({ updateFavorite, isFavorite }: UpdateFavoriteProps) => {

    const handleFavorite = () => {
        updateFavorite.mutate({ payload: !isFavorite });
    };

    return (
        <div role="button" onClick={handleFavorite}>
            <Heart
                className={cn(
                    "opacity-100 w-5 h-5 text-white",
                    isFavorite && "text-red-700",
                    updateFavorite?.isPending && "opacity-20",
                )}
            />
        </div>
    );
};