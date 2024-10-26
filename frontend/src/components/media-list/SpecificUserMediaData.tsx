import {zeroPad} from "@/utils/functions";
import {MediaStatus, MediaType} from "@/utils/types";


export const SpecificUserMediaData = ({userMedia, mediaType}: SpecificProps) => {
    if (["series", "anime"].includes(mediaType) && !["Plan to Watch", "Random"].includes(userMedia.status)) {
        return <EpsAndSeasons currentSeason={userMedia.current_season} currentEpisode={userMedia.last_episode_watched}/>;
    }

    if (mediaType === "games" && userMedia.status !== "Plan to Play") {
        return <PlaytimeInfo playtime={userMedia.playtime}/>;
    }

    if (mediaType === "books" && userMedia.status !== "Plan to Read") {
        return <PagesInfo actualPage={userMedia.actual_page} totalPages={userMedia.total_pages}/>;
    }
};


const EpsAndSeasons = ({currentSeason, currentEpisode}: { currentSeason: number; currentEpisode: number }) => {
    return (
        <div className="flex justify-center items-center h-[28px]">
            <div>S{zeroPad(currentSeason)}{" "}|{" "}E{zeroPad(currentEpisode)}</div>
        </div>
    );
};


const PlaytimeInfo = ({playtime}: { playtime: number }) => {
    return (
        <div className="h-[28px]">
            <div>{playtime / 60} hours</div>
        </div>
    );
};


const PagesInfo = ({actualPage, totalPages}: { actualPage: number; totalPages: number }) => {
    return (
        <div className="flex justify-center items-center h-[28px]">
            {actualPage}{" "}/{" "}{totalPages}
        </div>
    );
};


interface SpecificProps {
    userMedia: {
        playtime: number;
        actual_page: number;
        total_pages: number;
        status: MediaStatus;
        current_season: number;
        last_episode_watched: number;
    };
    mediaType: MediaType;
}
