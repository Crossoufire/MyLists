import {MediaType} from "@/lib/server/utils/enums";
import {mediaDetailsOptions} from "@/lib/react-query/query-options";
import {MediaTitle} from "@/lib/components/media-details/MediaTitle";
import {MoviesDetails} from "@/lib/components/media-details/MoviesDetails";


interface MediaDataDetailsProps {
    mediaType: MediaType;
    mediaData: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["media"];
}


const mediaDetailsMap = (value: MediaType) => {
    const components = {
        movies: MoviesDetails,
    };
    //@ts-expect-error
    return components[value];
};


export const MediaDataDetails = ({ mediaType, mediaData }: MediaDataDetailsProps) => {
    const MediaDetails = mediaDetailsMap(mediaType);

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
