import {zeroPad} from "@/lib/utils/functions";
import {MediaType, Status} from "@/lib/server/utils/enums";


interface SpecificUserMediaDataProps {
    userMedia: any;
    mediaType: MediaType;
}


export const SpecificUserMediaData = ({ userMedia, mediaType }: SpecificUserMediaDataProps) => {
    if (
        (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) &&
        !(userMedia.status === Status.PLAN_TO_WATCH || userMedia.status === Status.RANDOM)
    ) {
        return <EpsAndSeasons
            currentSeason={userMedia.currentSeason}
            currentEpisode={userMedia.lastEpisodeWatched}
        />;
    }

    if (mediaType === MediaType.GAMES && userMedia.status !== Status.PLAN_TO_PLAY) {
        return <PlaytimeInfo
            playtime={userMedia.playtime}
        />;
    }

    if (mediaType === MediaType.BOOKS && userMedia.status !== Status.PLAN_TO_READ) {
        return <PagesInfo
            actualPage={userMedia.actualPage}
            totalPages={userMedia.totalPages}
        />;
    }

    if (mediaType === MediaType.MANGA && userMedia.status !== Status.PLAN_TO_READ) {
        return <PagesInfo
            actualPage={userMedia.currentChapter}
            totalPages={userMedia.totalChapters ?? "?"}
        />;
    }
};


const EpsAndSeasons = ({ currentSeason, currentEpisode }: { currentSeason: number, currentEpisode: number }) => {
    return (
        <div className="flex justify-center items-center h-[28px]">
            <div>S{zeroPad(currentSeason)} - E{zeroPad(currentEpisode)}</div>
        </div>
    );
};


const PlaytimeInfo = ({ playtime }: { playtime: number }) => {
    return (
        <div className="h-[28px]">
            <div>{playtime / 60} hours</div>
        </div>
    );
};


const PagesInfo = ({ actualPage, totalPages }: { actualPage: number, totalPages: number }) => {
    return (
        <div className="flex justify-center items-center h-[28px]">
            {actualPage}{" "}/{" "}{totalPages}
        </div>
    );
};