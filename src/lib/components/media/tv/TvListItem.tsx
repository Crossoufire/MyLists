import {MediaType, Status} from "@/lib/server/utils/enums";
import {ExtractListByType} from "@/lib/components/types";
import {DisplayTvRedo} from "@/lib/components/media/tv/DisplayTvRedo";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {BaseMediaListItem} from "@/lib/components/media/base/BaseMediaListItem";
import {DisplayEpsAndSeasons} from "@/lib/components/media/tv/DisplayEpsAndSeasons";


interface TvListItemProps {
    isCurrent: boolean;
    isConnected: boolean;
    mediaType: MediaType;
    allStatuses: Status[];
    rating: React.ReactNode;
    queryKey: ReturnType<typeof queryKeys.userListKey>;
    userMedia: ExtractListByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
}


export const TvListItem = (props: TvListItemProps) => {
    return (
        <BaseMediaListItem
            {...props}
            redoDisplay={
                //@ts-expect-error
                props.userMedia.redo2.reduce((a, c) => a + c, 0) > 0 &&
                <DisplayTvRedo
                    //@ts-expect-error
                    redoValues={props.userMedia.redo2}
                />
            }
            mediaDetailsDisplay={
                <DisplayEpsAndSeasons
                    //@ts-expect-error
                    status={props.userMedia.status}
                    //@ts-expect-error
                    currentSeason={props.userMedia.currentSeason}
                    //@ts-expect-error
                    currentEpisode={props.userMedia.lastEpisodeWatched}
                />
            }
        />
    );
};