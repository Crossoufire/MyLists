import React from "react";
import {ColumnDef} from "@tanstack/react-table";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {TvDetails} from "@/lib/components/media/tv/TvDetails";
import {TvListItem} from "@/lib/components/media/tv/TvListItem";
import {TvFollowCard} from "@/lib/components/media/tv/TvFollowCard";
import {getTvColumns} from "@/lib/components/media/tv/TvListColumns";
import {TvUserDetails} from "@/lib/components/media/tv/TvUserDetails";
import {BooksDetails} from "@/lib/components/media/books/BooksDetails";
import {GamesDetails} from "@/lib/components/media/games/GamesDetails";
import {GameListItem} from "@/lib/components/media/games/GameListItem";
import {BookListItem} from "@/lib/components/media/books/BookListItem";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {MoviesDetails} from "@/lib/components/media/movies/MoviesDetails";
import {MovieListItem} from "@/lib/components/media/movies/MovieListItem";
import {GameFollowCard} from "@/lib/components/media/games/GameFollowCard";
import {BookFollowCard} from "@/lib/components/media/books/BookFollowCard";
import {ColumnConfigProps} from "@/lib/components/media/base/BaseListTable";
import {getTvActiveFilters} from "@/lib/components/media/tv/TvActiveFilters";
import {getGamesColumns} from "@/lib/components/media/games/GamesListColumns";
import {getBooksColumns} from "@/lib/components/media/books/BooksListColumns";
import {MovieFollowCard} from "@/lib/components/media/movies/MovieFollowCard";
import {BooksUserDetails} from "@/lib/components/media/books/BookUserDetails";
import {GamesUserDetails} from "@/lib/components/media/games/GamesUserDetails";
import {getMoviesColumns} from "@/lib/components/media/movies/MoviesListColumns";
import {MoviesUserDetails} from "@/lib/components/media/movies/MoviesUserDetails";
import {getBooksActiveFilters} from "@/lib/components/media/books/BooksActiveFilters";
import {getGamesActiveFilters} from "@/lib/components/media/games/GamesActiveFilters";
import {getMoviesActiveFilters} from "@/lib/components/media/movies/MoviesActiveFilters";
import {ExtractFollowByType, ExtractListByType, ExtractMediaDetailsByType, ExtractUserMediaByType, FilterConfig} from "@/lib/components/types";


export type MediaConfiguration = {
    [T in MediaType]: {
        mediaUserDetails: React.FC<{
            mediaType: T;
            userMedia: ExtractUserMediaByType<T>;
            queryKey: ReturnType<typeof queryKeys.userListKey> | ReturnType<typeof queryKeys.detailsKey>;
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
            queryKey: ReturnType<typeof queryKeys.userListKey>;
        }>;
        mediaListColumns: (props: ColumnConfigProps) => (ColumnDef<ExtractListByType<T>>)[];
        sheetFilters: () => FilterConfig[];
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
        //@ts-expect-error
        mediaUserDetails: TvUserDetails,
        mediaFollowCard: TvFollowCard,
        //@ts-expect-error
        mediaDetails: MoviesDetails,
        //@ts-expect-error
        mediaListCard: TvListItem,
        //@ts-expect-error
        mediaListColumns: getTvColumns,
        sheetFilters: getTvActiveFilters,
    },
};
