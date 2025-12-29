import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {DisplayTvRedo} from "@/lib/client/components/media/tv/DisplayTvRedo";
import {BaseMediaListItem} from "@/lib/client/components/media/base/BaseMediaListItem";
import {DisplayEpsAndSeasons} from "@/lib/client/components/media/tv/DisplayEpsAndSeasons";


type TvListItemProps<T extends MediaType> = Parameters<MediaConfig[T]["mediaListCard"]>[number];


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
                    currentEpisode={props.userMedia.currentEpisode}
                />
            }
        />
    );
};