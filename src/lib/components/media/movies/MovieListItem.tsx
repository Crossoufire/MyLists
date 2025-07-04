import {ExtractListByType} from "@/lib/components/types";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaListItem} from "@/lib/components/media/base/BaseMediaListItem";


interface MovieListItemProps {
    isCurrent: boolean;
    queryKey: string[];
    isConnected: boolean;
    mediaType: MediaType;
    allStatuses: Status[];
    rating: React.ReactNode;
    userMedia: ExtractListByType<typeof MediaType.MOVIES>;
}


export const MovieListItem = (props: MovieListItemProps) => {
    return (
        <BaseMediaListItem
            {...props}
            redoDisplay={!!props.userMedia.redo &&
                <DisplayRedoValue
                    redoValue={props.userMedia.redo}
                />
            }
        />
    );
};