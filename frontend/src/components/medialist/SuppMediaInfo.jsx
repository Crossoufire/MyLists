import {useParams} from "@tanstack/react-router";
import {PagesInput} from "@/components/medialist/PagesInput";
import {EpsAndSeasons} from "@/components/medialist/EpsAndSeasons";
import {PlaytimeListDrop} from "@/components/medialist/PlaytimeListDrop";


export const SuppMediaInfo = ({ isCurrent, media, status, postFunctions }) => {
    const { mediaType } = useParams({ strict: false });

    if (["series", "anime"].includes(mediaType) && !["Plan to Watch", "Random"].includes(status)) {
        return (
            <EpsAndSeasons
                status={status}
                isCurrent={isCurrent}
                initSeas={media.current_season}
                updateSeas={postFunctions.season}
                updateEps={postFunctions.episode}
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
                updatePlaytime={postFunctions.playtime}
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
                updatePage={postFunctions.page}
            />
        );
    }
};
