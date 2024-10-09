import {TvDetails} from "@/components/media-details/TvDetails";
import {MediaTitle} from "@/components/media-details/MediaTitle";
import {GamesDetails} from "@/components/media-details/GamesDetails";
import {BooksDetails} from "@/components/media-details/BooksDetails";
import {MoviesDetails} from "@/components/media-details/MoviesDetails";


const mediaDetailsMap = (value) => {
    const components = {
        movies: MoviesDetails,
        series: TvDetails,
        anime: TvDetails,
        games: GamesDetails,
        books: BooksDetails,
    };
    return components[value];
};


export const MediaDataDetails = ({ mediaType, mediaData }) => {
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
