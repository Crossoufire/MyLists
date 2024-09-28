import {InputComponent} from "@/components/app/InputComponent";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {EpsAndSeasons} from "@/components/medialist/EpsAndSeasons";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {PlaytimeListDrop} from "@/components/medialist/PlaytimeListDrop";


export const SuppMediaInfo = ({ isCurrent, userMedia, queryKey }) => {
    const { mediaType } = Route.useParams();
    const { updateSeason, updateEpisode, updatePage, updatePlaytime } = userMediaMutations(mediaType, userMedia.media_id, queryKey);

    if (["series", "anime"].includes(mediaType) && !["Plan to Watch", "Random"].includes(userMedia.status)) {
        return (
            <EpsAndSeasons
                isCurrent={isCurrent}
                updateEps={updateEpisode}
                updateSeason={updateSeason}
                epsPerSeason={userMedia.eps_per_season}
                currentSeason={userMedia.current_season}
                currentEpisode={userMedia.last_episode_watched}
            />
        );
    }
    if (mediaType === "games" && userMedia.status !== "Plan to Play") {
        return (
            <PlaytimeListDrop
                className="h-[26px]"
                isCurrent={isCurrent}
                playtime={userMedia.playtime}
                updatePlaytime={updatePlaytime}
            />
        );
    }
    if (mediaType === "books" && userMedia.status !== "Plan to Read") {
        return (
            <InputComponent
                onUpdate={updatePage}
                isEditable={isCurrent}
                total={userMedia.total_pages}
                inputClassName={"w-[40px] p-0"}
                initValue={userMedia.actual_page}
                containerClassName={"flex justify-center items-center h-[26px]"}
            />
        );
    }
};
