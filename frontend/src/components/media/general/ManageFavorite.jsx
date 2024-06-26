import {useState} from "react";
import {LuHeart} from "react-icons/lu";
import {useLoading} from "@/hooks/LoadingHook";
import {LoadingIcon} from "@/components/app/base/LoadingIcon";


export const ManageFavorite = ({ initFav, updateFavorite, isCurrent = true }) => {
    const [isLoading, handleLoading] = useLoading();
    const [favorite, setFavorite] = useState(initFav);

    const handleFavorite = async () => {
        const response = await handleLoading(updateFavorite, !favorite);
        if (response) {
            setFavorite(!favorite);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-baseline">
                <LoadingIcon size={4}/>
            </div>
        );
    }

    return (
        <>
            {isCurrent ?
                <div role="button" onClick={handleFavorite}>
                    <LuHeart className={favorite && "text-red-700"} title="Favorite"/>
                </div>
                :
                <span><LuHeart className={favorite && "text-red-700"} title="Favorite"/></span>
            }
        </>
    );
};