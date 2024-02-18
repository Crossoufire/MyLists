import {cn} from "@/lib/utils";
import {RedoListDrop} from "@/components/medialist/RedoListDrop";
import {RatingListDrop} from "@/components/medialist/RatingListDrop";
import {CommentPopover} from "@/components/medialist/CommentPopover";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";


export const UserMediaInfo = ({ isCurrent, mediaType, mediaData, userData, updateUserAPI }) => {
    const position = mediaType === "movies" ? "bottom-[0px]" : "bottom-[32px]";

    return (
        <div className={cn("absolute flex justify-center items-center h-[32px] w-full opacity-95 " +
            "bg-neutral-900 border border-black border-solid", position)}>
            <div className="flex justify-around items-center w-full">
                <ManageFavorite
                    isCurrent={isCurrent}
                    initFav={mediaData.favorite}
                    updateFavorite={updateUserAPI.favorite}
                />
                <RatingListDrop
                    isCurrent={isCurrent}
                    isFeeling={userData.add_feeling}
                    initRating={userData.add_feeling ? mediaData.feeling : mediaData.score}
                    updateRating={updateUserAPI.rating}
                />
                <CommentPopover
                    isCurrent={isCurrent}
                    mediaName={mediaData.media_name}
                    initContent={mediaData.comment}
                    updateComment={updateUserAPI.comment}
                />
                {(mediaData.status === "Completed" && mediaType !== "games") &&
                    <RedoListDrop
                        isCurrent={isCurrent}
                        initRedo={mediaData.rewatched}
                        updateRedo={updateUserAPI.redo}
                    />
                }
            </div>
        </div>
    );
};
