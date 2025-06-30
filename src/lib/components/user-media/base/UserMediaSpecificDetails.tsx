import {MediaType} from "@/lib/server/utils/enums";
import {mediaConfig} from "@/lib/components/media-config";
import {ExtractUserMediaByType} from "@/lib/components/types";


interface UserMediaSpecificDetailsProps<T extends MediaType> {
    mediaType: T;
    queryKey: string[];
    userMedia: ExtractUserMediaByType<T>;
}


export const UserMediaSpecificDetails = <T extends MediaType>({ mediaType, userMedia, queryKey }: UserMediaSpecificDetailsProps<T>) => {
    const SpecificComponent = mediaConfig[mediaType].mediaUserDetails;

    return (
        <SpecificComponent
            queryKey={queryKey}
            mediaType={mediaType}
            userMedia={userMedia}
        />
    );
}