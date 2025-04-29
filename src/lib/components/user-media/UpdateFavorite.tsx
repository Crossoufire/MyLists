import {Heart} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface UpdateFavoriteProps {
    isFavorite: boolean | undefined | null;
    updateFavorite: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdateFavorite = ({ updateFavorite, isFavorite }: UpdateFavoriteProps) => {

    const handleFavorite = () => {
        updateFavorite.mutate({ payload: { favorite: !isFavorite } });
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