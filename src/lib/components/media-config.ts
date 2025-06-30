import {MediaType} from "@/lib/server/utils/enums";
import {TvDetails} from "@/lib/components/media/tv/TvDetails";
import {GamesDetails} from "@/lib/components/media/games/GamesDetails";
import {MoviesDetails} from "@/lib/components/media/movies/MoviesDetails";
import {RedoFollowCard} from "@/lib/components/media/base/RedoFollowCard";
import {TvUserDetails} from "@/lib/components/user-media/tv/TvUserDetails";
import {TvRedoFollowCard} from "@/lib/components/media/tv/TvRedoFollowCard";
import {TvDetailsFollowCard} from "@/lib/components/media/tv/TvDetailsFollowCard";
import {GamesUserDetails} from "@/lib/components/user-media/games/GamesUserDetails";
import {MoviesUserDetails} from "@/lib/components/user-media/movies/MoviesUserDetails";
import {GamesDetailsFollowCard} from "@/lib/components/media/games/GamesDetailsFollowCard";
import {ExtractFollowsByType, ExtractMediaDetailsByType, ExtractUserMediaByType} from "@/lib/components/types";


type MediaConfiguration = {
    [T in MediaType]: {
        mediaUserDetails: React.FC<{
            mediaType: T;
            queryKey: string[];
            userMedia: ExtractUserMediaByType<T>;
        }>;
        mediaFollowCards: [
                React.FC<{ follow: ExtractFollowsByType<T> }> | null,
                React.FC<{ follow: ExtractFollowsByType<T> }> | null,
        ];
        mediaDetails: React.FC<{
            mediaType: T,
            mediaData: ExtractMediaDetailsByType<T>,
        }>;
    };
};


export const mediaConfig: MediaConfiguration = {
    [MediaType.SERIES]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCards: [TvRedoFollowCard, TvDetailsFollowCard],
        mediaDetails: TvDetails,
    },
    [MediaType.ANIME]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCards: [TvRedoFollowCard, TvDetailsFollowCard],
        mediaDetails: TvDetails,
    },
    [MediaType.MOVIES]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCards: [RedoFollowCard, null],
        mediaDetails: MoviesDetails,
    },
    [MediaType.GAMES]: {
        mediaUserDetails: GamesUserDetails,
        mediaFollowCards: [null, GamesDetailsFollowCard],
        mediaDetails: GamesDetails,
    },
    [MediaType.BOOKS]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCards: [RedoFollowCard, null],
        mediaDetails: MoviesDetails,
    },
    [MediaType.MANGA]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCards: [RedoFollowCard, null],
        mediaDetails: MoviesDetails,
    },
};