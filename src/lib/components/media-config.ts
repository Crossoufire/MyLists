import {MediaType} from "@/lib/server/utils/enums";
import {TvUserDetails} from "@/lib/components/user-media/tv/TvUserDetails";
import {TvRedoFollowCard} from "@/lib/components/media/tv/TvRedoFollowCard";
import {TvDetailsFollowCard} from "@/lib/components/media/tv/TvDetailsFollowCard";
import {GamesUserDetails} from "@/lib/components/user-media/games/GamesUserDetails";
import {MoviesUserDetails} from "@/lib/components/user-media/movies/MoviesUserDetails";
import {ExtractUserMediaByType} from "@/lib/components/user-media/base/UserMediaDetails";


type MediaConfiguration = {
    [T in MediaType]: {
        mediaUserDetails: React.FC<{
            mediaType: T;
            queryKey: string[];
            userMedia: ExtractUserMediaByType<T>;
        }>;
        mediaFollowCard: React.FC<{
            follow: any;
        }>[];
    };
};


export const mediaConfig: MediaConfiguration = {
    [MediaType.SERIES]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: [TvRedoFollowCard, TvDetailsFollowCard],
    },
    [MediaType.ANIME]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: [],
    },
    [MediaType.MOVIES]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: [],
    },
    [MediaType.GAMES]: {
        mediaUserDetails: GamesUserDetails,
        mediaFollowCard: [],
    },
    [MediaType.BOOKS]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: [],
    },
    [MediaType.MANGA]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: [],
    },
};