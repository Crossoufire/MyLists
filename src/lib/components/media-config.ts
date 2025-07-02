import {MediaType, Status} from "@/lib/server/utils/enums";
import {TvDetails} from "@/lib/components/media/tv/TvDetails";
import {TvListItem} from "@/lib/components/media/tv/TvListItem";
import {TvFollowCard} from "@/lib/components/media/tv/TvFollowCard";
import {TvUserDetails} from "@/lib/components/media/tv/TvUserDetails";
import {GamesDetails} from "@/lib/components/media/games/GamesDetails";
import {GameListItem} from "@/lib/components/media/games/GameListItem";
import {MoviesDetails} from "@/lib/components/media/movies/MoviesDetails";
import {MovieListItem} from "@/lib/components/media/movies/MovieListItem";
import {GameFollowCard} from "@/lib/components/media/games/GameFollowCard";
import {MovieFollowCard} from "@/lib/components/media/movies/MovieFollowCard";
import {GamesUserDetails} from "@/lib/components/media/games/GamesUserDetails";
import {MoviesUserDetails} from "@/lib/components/media/movies/MoviesUserDetails";
import {ExtractFollowByType, ExtractListByType, ExtractMediaDetailsByType, ExtractUserMediaByType} from "@/lib/components/types";


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
        mediaListCard: React.FC<{
            mediaType: T,
            queryKey: string[],
            isCurrent: boolean,
            isConnected: boolean,
            allStatuses: Status[],
            rating: React.ReactNode,
            userMedia: ExtractListByType<T>,
        }>;
    };
};


export const mediaConfig: MediaConfiguration = {
    [MediaType.SERIES]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: TvDetails,
        mediaListCard: TvListItem,
    },
    [MediaType.ANIME]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: TvDetails,
        mediaListCard: TvListItem,
    },
    [MediaType.MOVIES]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: MovieFollowCard,
        mediaDetails: MoviesDetails,
        mediaListCard: MovieListItem,
    },
    [MediaType.GAMES]: {
        mediaUserDetails: GamesUserDetails,
        mediaFollowCard: GameFollowCard,
        mediaDetails: GamesDetails,
        mediaListCard: GameListItem,
    },
    [MediaType.BOOKS]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: MoviesDetails,
        mediaListCard: TvListItem,
    },
    [MediaType.MANGA]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: MoviesDetails,
        mediaListCard: TvListItem,
    },
};
