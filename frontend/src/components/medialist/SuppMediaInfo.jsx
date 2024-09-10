import {InputComponent} from "@/components/app/InputComponent";
import {useParams, useSearch} from "@tanstack/react-router";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {EpsAndSeasons} from "@/components/medialist/EpsAndSeasons";
import {PlaytimeListDrop} from "@/components/medialist/PlaytimeListDrop";


export const SuppMediaInfo = ({ isCurrent, media }) => {
    const search = useSearch({ strict: false });
    const { mediaType, username } = useParams({ strict: false });
    const { updateSeason, updateEpisode, updatePage, updatePlaytime } = userMediaMutations(
        mediaType, media.media_id, ["userList", mediaType, username, search]
    );

    if (["series", "anime"].includes(mediaType) && !["Plan to Watch", "Random"].includes(media.status)) {
        return (
            <EpsAndSeasons
                isCurrent={isCurrent}
                updateEps={updateEpisode}
                updateSeason={updateSeason}
                epsPerSeason={media.eps_per_season}
                currentSeason={media.current_season}
                currentEpisode={media.last_episode_watched}
            />
        );
    }
    if (mediaType === "games" && media.status !== "Plan to Play") {
        return (
            <PlaytimeListDrop
                className="h-[26px]"
                isCurrent={isCurrent}
                playtime={media.playtime}
                updatePlaytime={updatePlaytime}
            />
        );
    }
    if (mediaType === "books" && media.status !== "Plan to Read") {
        return (
            <InputComponent
                onUpdate={updatePage}
                isEditable={isCurrent}
                total={media.total_pages}
                initValue={media.actual_page}
                inputClassName={"w-[40px] p-0"}
                containerClassName={"flex justify-center items-center h-[26px]"}
            />
        );
    }
};
