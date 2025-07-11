import {MediaType} from "@/lib/server/utils/enums";
import {mediaConfig} from "@/lib/components/media-config";
import {ExtractUserMediaByType} from "@/lib/components/types";
import {queryKeys} from "@/lib/react-query/query-options/query-options";


interface UserMediaSpecificDetailsProps<T extends MediaType> {
    mediaType: T;
    userMedia: ExtractUserMediaByType<T>;
    queryKey: ReturnType<typeof queryKeys.userListKey> | ReturnType<typeof queryKeys.detailsKey>;
}


export const UserMediaSpecificDetails = <T extends MediaType>({ mediaType, userMedia, queryKey }: UserMediaSpecificDetailsProps<T>) => {
    const SpecificDetailsComponent = mediaConfig[mediaType].mediaUserDetails;

    return (
        <SpecificDetailsComponent
            queryKey={queryKey}
            mediaType={mediaType}
            userMedia={userMedia}
        />
    );
}