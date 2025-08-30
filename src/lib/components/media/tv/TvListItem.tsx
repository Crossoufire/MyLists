import {MediaType} from "@/lib/server/utils/enums";
import {MediaConfiguration} from "@/lib/components/media/media-config";
import {DisplayTvRedo} from "@/lib/components/media/tv/DisplayTvRedo";
import {BaseMediaListItem} from "@/lib/components/media/base/BaseMediaListItem";
import {DisplayEpsAndSeasons} from "@/lib/components/media/tv/DisplayEpsAndSeasons";


type TvListItemProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaListCard"]>[0];


export const TvListItem = (props: TvListItemProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    return (
        <BaseMediaListItem
            {...props}
            redoDisplay={
                props.userMedia.redo2.reduce((a, c) => a + c, 0) > 0 &&
                <DisplayTvRedo
                    redoValues={props.userMedia.redo2}
                />
            }
            mediaDetailsDisplay={
                <DisplayEpsAndSeasons
                    status={props.userMedia.status}
                    currentSeason={props.userMedia.currentSeason}
                    currentEpisode={props.userMedia.lastEpisodeWatched}
                />
            }
        />
    );
};