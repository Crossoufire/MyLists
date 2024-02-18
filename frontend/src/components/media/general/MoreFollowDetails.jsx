import {FaPlay} from "react-icons/fa";


export const MoreFollowDetails = ({ mediaType, follow }) => {
    if (mediaType === "series" || mediaType === "anime") {
        if (!["Random", "Plan to Watch"].includes(follow.status)) {
            return (
                <div className="flex gap-x-3 items-center">
                    <FaPlay size={14} className="mt-1"/> Season: {follow.current_season} - Episode: {follow.last_episode_watched}
                </div>
            );
        }
    }
    else if (mediaType === "books") {
        if (follow.status !== "Plan to Read") {
            return (
                <div className="flex gap-x-3 items-center">
                    <FaPlay size={14} className="mt-1"/> Page: {follow.actual_page}/{follow.total_pages}
                </div>
            );
        }
    }
    else if (mediaType === "games") {
        if (follow.status !== "Plan to Play") {
            return (
                <div className="flex gap-x-3 items-center">
                    <FaPlay size={14} className="mt-1"/> Playtime: {follow.playtime / 60} h
                </div>
            );
        }
    }
};
