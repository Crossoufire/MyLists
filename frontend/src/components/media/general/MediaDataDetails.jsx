import {TvDetails} from "@/components/media/tv/TvDetails";
import {MediaTitle} from "@/components/media/general/MediaTitle";
import {GamesDetails} from "@/components/media/games/GamesDetails";
import {BooksDetails} from "@/components/media/books/BooksDetails";
import {MoviesDetails} from "@/components/media/movies/MoviesDetails";


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
