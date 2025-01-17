import {zeroPad} from "@/utils/functions";


export const SpecificUserMediaData = ({ userMedia, mediaType }) => {
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


const EpsAndSeasons = ({ currentSeason, currentEpisode }) => {
    return (
        <div className="flex justify-center items-center h-[28px]">
            <div>S{zeroPad(currentSeason)}{" "}|{" "}E{zeroPad(currentEpisode)}</div>
        </div>
    );
};


const PlaytimeInfo = ({ playtime }) => {
    return (
        <div className="h-[28px]">
            <div>{playtime / 60} hours</div>
        </div>
    );
};


const PagesInfo = ({ actualPage, totalPages }) => {
    return (
        <div className="flex justify-center items-center h-[28px]">
            {actualPage}{" "}/{" "}{totalPages}
        </div>
    );
};