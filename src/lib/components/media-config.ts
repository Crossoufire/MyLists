import {MediaType} from "@/lib/server/utils/enums";
import {TvDetails} from "@/lib/components/media/tv/TvDetails";
import {DisplayTvRedo} from "@/lib/components/media/tv/DisplayTvRedo";
import {GamesDetails} from "@/lib/components/media/games/GamesDetails";
import {MoviesDetails} from "@/lib/components/media/movies/MoviesDetails";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {TvUserDetails} from "@/lib/components/user-media/tv/TvUserDetails";
import {DisplayEpsAndSeasons} from "@/lib/components/media/tv/DisplayEpsAndSeasons";
import {GamesUserDetails} from "@/lib/components/user-media/games/GamesUserDetails";
import {MoviesUserDetails} from "@/lib/components/user-media/movies/MoviesUserDetails";
import {DisplayPlaytime} from "@/lib/components/media/games/DisplayPlaytime";
import {ExtractFollowsByType, ExtractListByType, ExtractMediaDetailsByType, ExtractUserMediaByType} from "@/lib/components/types";


type MediaConfiguration = {
    [T in MediaType]: {
        mediaUserDetails: React.FC<{
            mediaType: T;
            queryKey: string[];
            userMedia: ExtractUserMediaByType<T>;
        }>;
        mediaFollowCards: [
                React.FC<{ userData: ExtractFollowsByType<T> }> | null,
                React.FC<{ userData: ExtractFollowsByType<T> }> | null,
        ];
        mediaDetails: React.FC<{
            mediaType: T,
            mediaData: ExtractMediaDetailsByType<T>,
        }>;
        listDetailsCards: [
                React.FC<{ userData: ExtractListByType<T> }> | null,
                React.FC<{ userData: ExtractListByType<T> }> | null,
        ];
    };
};


export const mediaConfig: MediaConfiguration = {
    [MediaType.SERIES]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCards: [DisplayTvRedo, DisplayEpsAndSeasons],
        mediaDetails: TvDetails,
        listDetailsCards: [DisplayTvRedo, DisplayEpsAndSeasons],
    },
    [MediaType.ANIME]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCards: [DisplayTvRedo, DisplayEpsAndSeasons],
        mediaDetails: TvDetails,
        listDetailsCards: [DisplayTvRedo, DisplayEpsAndSeasons],
    },
    [MediaType.MOVIES]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCards: [DisplayRedoValue, null],
        mediaDetails: MoviesDetails,
        listDetailsCards: [DisplayRedoValue, null],
    },
    [MediaType.GAMES]: {
        mediaUserDetails: GamesUserDetails,
        mediaFollowCards: [null, DisplayPlaytime],
        mediaDetails: GamesDetails,
        listDetailsCards: [null, DisplayPlaytime],
    },
    [MediaType.BOOKS]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCards: [DisplayRedoValue, null],
        mediaDetails: MoviesDetails,
        listDetailsCards: [DisplayRedoValue, null],
    },
    [MediaType.MANGA]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCards: [DisplayRedoValue, null],
        mediaDetails: MoviesDetails,
        listDetailsCards: [DisplayRedoValue, null],
    },
};