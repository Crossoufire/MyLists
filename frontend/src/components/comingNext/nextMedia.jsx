import {cn, zeroPad} from "@/lib/utils";
import {MediaCard} from "@/components/reused/MediaCard";


export const NextMedia = ({ mediaType, media }) => {
    const position = mediaType === ("movies" || "games") ? "bottom-[0px]" : "bottom-[32px]";

    return (
        <MediaCard media={media} mediaType={mediaType}>
            {(mediaType === "anime" || mediaType === "series") &&
                <div className={cn("absolute flex justify-center items-center h-[32px] w-full opacity-95 " +
                    "bg-neutral-900 border border-black border-solid", position)}>
                    S{zeroPad(media.season_to_air)}&nbsp;-&nbsp;E{zeroPad(media.episode_to_air)}
                </div>
            }
            <div className="flex justify-center items-center h-[32px] w-full opacity-90 bg-gray-900 border
                border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
                {media.date}
            </div>
        </MediaCard>
    )
};
