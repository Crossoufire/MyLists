import {MediaType} from "@/lib/utils/enums";
import {mediaConfig} from "@/lib/client/components/media/media-config";
import {ExtractUserMediaByType} from "@/lib/types/query.options.types";
import {ModifyUserMedia} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface UserMediaSpecificDetailsProps<T extends MediaType> {
    mediaType: T;
    queryOption: ModifyUserMedia;
    userMedia: ExtractUserMediaByType<T>;
}


export const UserMediaSpecificDetails = <T extends MediaType>({ mediaType, userMedia, queryOption }: UserMediaSpecificDetailsProps<T>) => {
    const SpecificDetailsComponent = mediaConfig[mediaType].mediaUserDetails;

    return (
        <SpecificDetailsComponent
            mediaType={mediaType}
            userMedia={userMedia}
            queryOption={queryOption}
        />
    );
}