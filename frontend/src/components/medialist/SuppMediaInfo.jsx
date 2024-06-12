import {useParams} from "@tanstack/react-router";
import {PagesInput} from "@/components/medialist/PagesInput";
import {EpsAndSeasons} from "@/components/medialist/EpsAndSeasons";
import {PlaytimeListDrop} from "@/components/medialist/PlaytimeListDrop";


export const SuppMediaInfo = ({ isCurrent, media, status, updateUserAPI }) => {
    const { mediaType } = useParams({ strict: false });

    if (["series", "anime"].includes(mediaType) && !["Plan to Watch", "Random"].includes(status)) {
        return (
            <EpsAndSeasons
                status={status}
                isCurrent={isCurrent}
                initSeas={media.current_season}
                updateSeas={updateUserAPI.season}
                updateEps={updateUserAPI.episode}
                epsPerSeason={media.eps_per_season}
                initEps={media.last_episode_watched}
            />
        );
    }

    if (mediaType === "games" && status !== "Plan to Play") {
        return (
            <PlaytimeListDrop
                isCurrent={isCurrent}
                initPlaytime={media.playtime}
                updatePlaytime={updateUserAPI.playtime}
            />
        );
    }
    if (mediaType === "books" && status !== "Plan to Read") {
        return (
            <PagesInput
                status={status}
                isCurrent={isCurrent}
                initPage={media.actual_page}
                totalPages={media.total_pages}
                updatePage={updateUserAPI.page}
            />
        );
    }
};
