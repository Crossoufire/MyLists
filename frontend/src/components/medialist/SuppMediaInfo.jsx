import {useUpdateUserMediaList} from "@/utils/mutations";
import {useParams, useSearch} from "@tanstack/react-router";
import {PagesInput} from "@/components/medialist/PagesInput";
import {EpsAndSeasons} from "@/components/medialist/EpsAndSeasons";
import {PlaytimeListDrop} from "@/components/medialist/PlaytimeListDrop";


export const SuppMediaInfo = ({ isCurrent, media }) => {
    const search = useSearch({ strict: false });
    const { mediaType, username } = useParams({ strict: false });

    const onSeasonSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, current_season: variables.payload, last_episode_watched: 1 };
            }
            return m;
        });
        return newData;
    };
    const onEpisodeSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, last_episode_watched: variables.payload };
            }
            return m;
        });
        return newData;
    };
    const onPageSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, actual_page: variables.payload };
            }
            return m;
        });
        return newData;
    };
    const onPlaytimeSuccess = (oldData, variables) => {
        const newData = { ...oldData };
        newData.media_data = newData.media_data.map(m => {
            if (m.media_id === media.media_id) {
                return { ...m, playtime: variables.payload };
            }
            return m;
        });
        return newData;
    };

    const pageMutation = useUpdateUserMediaList("update_page", mediaType, media.media_id, username, search, onPageSuccess);
    const seasonMutation = useUpdateUserMediaList("update_season", mediaType, media.media_id, username, search, onSeasonSuccess);
    const episodeMutation = useUpdateUserMediaList("update_episode", mediaType, media.media_id, username, search, onEpisodeSuccess);
    const playtimeMutation = useUpdateUserMediaList("update_playtime", mediaType, media.media_id, username, search, onPlaytimeSuccess);

    if (["series", "anime"].includes(mediaType) && !["Plan to Watch", "Random"].includes(media.status)) {
        return (
            <EpsAndSeasons
                isCurrent={isCurrent}
                updateEps={episodeMutation}
                updateSeason={seasonMutation}
                epsPerSeason={media.eps_per_season}
                currentSeason={media.current_season}
                currentEpisode={media.last_episode_watched}
            />
        );
    }
    if (mediaType === "games" && media.status !== "Plan to Play") {
        return (
            <PlaytimeListDrop
                isCurrent={isCurrent}
                playtime={media.playtime}
                updatePlaytime={playtimeMutation}
            />
        );
    }
    if (mediaType === "books" && media.status !== "Plan to Read") {
        return (
            <PagesInput
                isCurrent={isCurrent}
                updatePage={pageMutation}
                initPage={media.actual_page}
                totalPages={media.total_pages}
            />
        );
    }
};
