import {PagesInput} from "@/components/medialist/PagesInput";
import {EpsAndSeasons} from "@/components/medialist/EpsAndSeasons";
import {PlaytimeListDrop} from "@/components/medialist/PlaytimeListDrop";


export const SuppMediaInfo = ({ isCurrent, mediaType, mediaData, mediaStatus, updateUserAPI }) => {
    if (["series", "anime"].includes(mediaType)) {
        return (
            <EpsAndSeasons
                isCurrent={isCurrent}
                initSeason={mediaData.current_season}
                initEpisode={mediaData.last_episode_watched}
                epsPerSeason={mediaData.eps_per_season}
                updateSeas={updateUserAPI.season}
                updateEps={updateUserAPI.episode}
                status={mediaStatus}
            />
        );
    }

    if (mediaType === "games") {
        return (
            <PlaytimeListDrop
                isCurrent={isCurrent}
                initPlaytime={mediaData.playtime}
                updatePlaytime={updateUserAPI.playtime}
                status={mediaStatus}
            />
        );
    }

    if (mediaType === "books") {
        return (
            <PagesInput
                isCurrent={isCurrent}
                initPage={mediaData.actual_page}
                totalPages={mediaData.total_pages}
                updatePage={updateUserAPI.page}
                status={mediaStatus}
            />
        );
    }
};
