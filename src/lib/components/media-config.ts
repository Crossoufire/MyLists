import {MediaType} from "@/lib/server/utils/enums";
import {TvDetails} from "@/lib/components/media/tv/TvDetails";
import {TvFollowCard} from "@/lib/components/media/tv/TvFollowCard";
import {GamesDetails} from "@/lib/components/media/games/GamesDetails";
import {MoviesDetails} from "@/lib/components/media/movies/MoviesDetails";
import {GameFollowCard} from "@/lib/components/media/games/GameFollowCard";
import {TvUserDetails} from "@/lib/components/user-media/tv/TvUserDetails";
import {MovieFollowCard} from "@/lib/components/media/movies/MovieFollowCard";
import {GamesUserDetails} from "@/lib/components/user-media/games/GamesUserDetails";
import {MoviesUserDetails} from "@/lib/components/user-media/movies/MoviesUserDetails";
import {ExtractFollowByType, ExtractMediaDetailsByType, ExtractUserMediaByType} from "@/lib/components/types";


type MediaConfiguration = {
    [T in MediaType]: {
        mediaUserDetails: React.FC<{
            mediaType: T;
            queryKey: string[];
            userMedia: ExtractUserMediaByType<T>;
        }>;
        mediaFollowCard: React.FC<{
            rating: React.ReactNode,
            followData: ExtractFollowByType<T>,
        }>;
        mediaDetails: React.FC<{
            mediaType: T,
            mediaData: ExtractMediaDetailsByType<T>,
        }>;
        listDetailsCards: null;
    };
};


export const mediaConfig: MediaConfiguration = {
    [MediaType.SERIES]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: TvDetails,
        listDetailsCards: null,
    },
    [MediaType.ANIME]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: TvDetails,
        listDetailsCards: null,
    },
    [MediaType.MOVIES]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: MovieFollowCard,
        mediaDetails: MoviesDetails,
        listDetailsCards: null,
    },
    [MediaType.GAMES]: {
        mediaUserDetails: GamesUserDetails,
        mediaFollowCard: GameFollowCard,
        mediaDetails: GamesDetails,
        listDetailsCards: null,
    },
    [MediaType.BOOKS]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: MoviesDetails,
        listDetailsCards: null,
    },
    [MediaType.MANGA]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: MoviesDetails,
        listDetailsCards: null,
    },
};
