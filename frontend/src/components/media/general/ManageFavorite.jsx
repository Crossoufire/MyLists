import {useState} from "react";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {FaHeart, FaRegHeart} from "react-icons/fa";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";


export const ManageFavorite = ({ initFav, updateFavorite, isCurrent = true }) => {
    const [isLoading, handleLoading] = useLoading();
    const [favorite, setFavorite] = useState(initFav || false);
    const Icon = favorite ? FaHeart : FaRegHeart;

    const handleFavorite = async () => {
        const response = await handleLoading(updateFavorite, !favorite);
        if (response) {
            setFavorite(!favorite);
        }
    };

    return (
        <>
            {isLoading ?
                <LoadingIcon size={6}/>
                :
                <Tooltip text="Favorite">
                    <div role="button" onClick={isCurrent && handleFavorite} className={!isCurrent && "cursor-auto"}>
                        <Icon className={favorite && "text-red-700"}/>
                    </div>
                </Tooltip>
            }
        </>
    );
};