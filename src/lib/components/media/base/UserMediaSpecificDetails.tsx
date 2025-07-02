import {MediaType} from "@/lib/server/utils/enums";
import {mediaConfig} from "@/lib/components/media-config";
import {ExtractUserMediaByType} from "@/lib/components/types";


interface UserMediaSpecificDetailsProps<T extends MediaType> {
    mediaType: T;
    queryKey: string[];
    userMedia: ExtractUserMediaByType<T>;
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