import {MediaType} from "@/lib/server/utils/enums";
import {TvDetails} from "@/lib/components/media/tv/TvDetails";
import {MediaTitle} from "@/lib/components/media/base/MediaTitle";
import {GamesDetails} from "@/lib/components/media/games/GamesDetails";
import {MoviesDetails} from "@/lib/components/media/movies/MoviesDetails";
import {mediaDetailsOptions} from "@/lib/react-query/query-options/query-options";


interface MediaDataDetailsProps {
    mediaType: MediaType;
    mediaData: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["media"];
}


const mediaDetailsMap = (value: MediaType) => {
    const components = {
        series: TvDetails,
        anime: TvDetails,
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
