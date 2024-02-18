import {zeroPad} from "@/lib/utils";
import {MediaCard} from "@/components/reused/MediaCard";


export const NextMedia = ({ mediaType, media }) => {
    return (
        <MediaCard media={media} mediaType={mediaType}>
            {(mediaType === "anime" || mediaType === "series") &&
                <div className="z-20 absolute flex justify-center items-center bottom-[0px] h-[32px] w-full opacity-90
                border border-black bg-neutral-950">
                    S{zeroPad(media.season_to_air)}&nbsp;-&nbsp;E{zeroPad(media.episode_to_air)}
                </div>
            }
            <div className="z-20 absolute h-[32px] flex items-center justify-center w-full opacity-90 bg-teal-950
            border border-x-black border-b-black border-t-transparent rounded-bl-md rounded-br-md">
                {media.date}
            </div>
        </MediaCard>
    )
};
