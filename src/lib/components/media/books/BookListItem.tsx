import React from "react";
import {ExtractListByType} from "@/lib/components/types";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {BaseMediaListItem} from "@/lib/components/media/base/BaseMediaListItem";


interface BookListItemProps {
    isCurrent: boolean;
    isConnected: boolean;
    mediaType: MediaType;
    allStatuses: Status[];
    rating: React.ReactNode;
    queryKey: ReturnType<typeof queryKeys.userListKey>;
    userMedia: ExtractListByType<typeof MediaType.BOOKS>;
}


export const BookListItem = (props: BookListItemProps) => {
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