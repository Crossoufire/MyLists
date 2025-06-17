import {MediaType} from "@/lib/server/utils/enums";
import {MediaTitle} from "@/lib/components/media-details/MediaTitle";
import {GamesDetails} from "@/lib/components/media-details/GamesDetails";
import {MoviesDetails} from "@/lib/components/media-details/MoviesDetails";
import {mediaDetailsOptions} from "@/lib/react-query/query-options/query-options";


interface MediaDataDetailsProps {
    mediaType: MediaType;
    mediaData: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["media"];
}


const mediaDetailsMap = (value: MediaType) => {
    const components = {
        movies: MoviesDetails,
        games: GamesDetails,
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
