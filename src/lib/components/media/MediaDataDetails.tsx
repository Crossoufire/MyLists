import {MediaType} from "@/lib/server/utils/enums";
import {mediaConfig} from "@/lib/components/media-config";
import {MediaTitle} from "@/lib/components/media/base/MediaTitle";
import {ExtractMediaDetailsByType} from "@/lib/components/types";


interface MediaDataDetailsProps<T extends MediaType> {
    mediaType: T;
    mediaData: ExtractMediaDetailsByType<T>;
}


export const MediaDataDetails = <T extends MediaType>({ mediaType, mediaData }: MediaDataDetailsProps<T>) => {
    const MediaDetails = mediaConfig[mediaType].mediaDetails;

    return (
        <>
            <MediaTitle className="mt-4">Details</MediaTitle>
            <MediaDetails
                mediaType={mediaType}
                mediaData={mediaData}
            />
        </>
    );
};
