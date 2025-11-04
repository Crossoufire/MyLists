import React from "react";
import {ColumnDef} from "@tanstack/react-table";
import {MediaType, Status} from "@/lib/utils/enums";
import {SheetFilterObject} from "@/lib/types/base.types";
import {TvDetails} from "@/lib/client/components/media/tv/TvDetails";
import {TvListItem} from "@/lib/client/components/media/tv/TvListItem";
import {TvFollowCard} from "@/lib/client/components/media/tv/TvFollowCard";
import {getTvColumns} from "@/lib/client/components/media/tv/TvListColumns";
import {TvUserDetails} from "@/lib/client/components/media/tv/TvUserDetails";
import {BooksDetails} from "@/lib/client/components/media/books/BooksDetails";
import {GamesDetails} from "@/lib/client/components/media/games/GamesDetails";
import {GameListItem} from "@/lib/client/components/media/games/GameListItem";
import {MangaDetails} from "@/lib/client/components/media/manga/MangaDetails";
import {BookListItem} from "@/lib/client/components/media/books/BookListItem";
import {MangaListItem} from "@/lib/client/components/media/manga/MangaListItem";
import {MoviesDetails} from "@/lib/client/components/media/movies/MoviesDetails";
import {MovieListItem} from "@/lib/client/components/media/movies/MovieListItem";
import {GameFollowCard} from "@/lib/client/components/media/games/GameFollowCard";
import {BookFollowCard} from "@/lib/client/components/media/books/BookFollowCard";
import {ColumnConfigProps} from "@/lib/client/components/media/base/BaseListTable";
import {getTvActiveFilters} from "@/lib/client/components/media/tv/TvActiveFilters";
import {MangaFollowCard} from "@/lib/client/components/media/manga/MangaFollowCard";
import {getGamesColumns} from "@/lib/client/components/media/games/GamesListColumns";
import {getBooksColumns} from "@/lib/client/components/media/books/BooksListColumns";
import {getMangaColumns} from "@/lib/client/components/media/manga/MangaListColumns";
import {MovieFollowCard} from "@/lib/client/components/media/movies/MovieFollowCard";
import {BooksUserDetails} from "@/lib/client/components/media/books/BookUserDetails";
import {MangaUserDetails} from "@/lib/client/components/media/manga/MangaUserDetails";
import {GamesUserDetails} from "@/lib/client/components/media/games/GamesUserDetails";
import {getMoviesColumns} from "@/lib/client/components/media/movies/MoviesListColumns";
import {MoviesUserDetails} from "@/lib/client/components/media/movies/MoviesUserDetails";
import {getMangaActiveFilters} from "@/lib/client/components/media/manga/MangaActiveFilters";
import {getBooksActiveFilters} from "@/lib/client/components/media/books/BooksActiveFilters";
import {getGamesActiveFilters} from "@/lib/client/components/media/games/GamesActiveFilters";
import {ModifyUserMedia} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {getMoviesActiveFilters} from "@/lib/client/components/media/movies/MoviesActiveFilters";
import {ExtractFollowByType, ExtractListByType, ExtractMediaDetailsByType, ExtractUserMediaByType} from "@/lib/types/query.options.types";
import {mediaListOptions} from "@/lib/client/react-query/query-options/query-options";


export type MediaConfiguration = {
    [T in MediaType]: {
        mediaUserDetails: React.FC<{
            mediaType: T;
            queryOption: ModifyUserMedia;
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
            isCurrent: boolean,
            isConnected: boolean,
            allStatuses: Status[],
            rating: React.ReactNode,
            userMedia: ExtractListByType<T>,
            queryOption: ReturnType<typeof mediaListOptions>;
        }>;
        mediaListColumns: (props: ColumnConfigProps) => (ColumnDef<ExtractListByType<T>>)[];
        sheetFilters: () => SheetFilterObject[];
    };
};


export const mediaConfig: MediaConfiguration = {
    [MediaType.SERIES]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: TvDetails,
        mediaListCard: TvListItem,
        mediaListColumns: getTvColumns,
        sheetFilters: getTvActiveFilters,
    },
    [MediaType.ANIME]: {
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: TvFollowCard,
        mediaDetails: TvDetails,
        mediaListCard: TvListItem,
        mediaListColumns: getTvColumns,
        sheetFilters: getTvActiveFilters,
    },
    [MediaType.MOVIES]: {
        mediaUserDetails: MoviesUserDetails,
        mediaFollowCard: MovieFollowCard,
        mediaDetails: MoviesDetails,
        mediaListCard: MovieListItem,
        mediaListColumns: getMoviesColumns,
        sheetFilters: getMoviesActiveFilters,
    },
    [MediaType.GAMES]: {
        mediaUserDetails: GamesUserDetails,
        mediaFollowCard: GameFollowCard,
        mediaDetails: GamesDetails,
        mediaListCard: GameListItem,
        mediaListColumns: getGamesColumns,
        sheetFilters: getGamesActiveFilters,
    },
    [MediaType.BOOKS]: {
        mediaUserDetails: BooksUserDetails,
        mediaFollowCard: BookFollowCard,
        mediaDetails: BooksDetails,
        mediaListCard: BookListItem,
        mediaListColumns: getBooksColumns,
        sheetFilters: getBooksActiveFilters,
    },
    [MediaType.MANGA]: {
        mediaUserDetails: MangaUserDetails,
        mediaFollowCard: MangaFollowCard,
        mediaDetails: MangaDetails,
        mediaListCard: MangaListItem,
        mediaListColumns: getMangaColumns,
        sheetFilters: getMangaActiveFilters,
    },
};
