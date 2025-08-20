import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";


export interface ProviderSearchResults {
    hasNextPage: boolean,
    data: ProviderSearchResult[],

}


export interface ProviderSearchResult {
    name: string
    image: string
    id: number | string
    date: string | number | undefined
    itemType: MediaType | ApiProviderType
}


export interface TrendsMedia {
    apiId: number,
    overview: string,
    posterPath: string,
    displayName: string,
    releaseDate: string,
    mediaType: MediaType,
}


export interface SearchData<T> {
    rawData: T;
    page: number;
    resultsPerPage: number;
}


interface IdNamePair {
    id: number;
    name: string;
}


// --- IGDB Provider Types --------------------------------------------------------------

export interface IgdbTokenResponse {
    access_token?: string,
    expires_in: number,
    token_type: string,
}


export interface IgdbSearchResultItem {
    id: number;
    name: string;
    cover?: {
        id: number;
        image_id: string;
    };
    first_release_date?: number;
}


export type IgdbMultiQueryResult<T> = {
    result: T[];
    name: string;
    count?: number;
};


export type IgdbSearchResponse = [IgdbMultiQueryResult<{ count: number }>, IgdbMultiQueryResult<IgdbSearchResultItem>];


export interface IgdbGameDetails {
    id: number;
    url: string;
    name: string;
    summary?: string;
    total_rating?: number;
    genres?: IdNamePair[];
    themes?: IdNamePair[];
    platforms?: IdNamePair[];
    game_modes?: IdNamePair[];
    first_release_date?: number;
    total_rating_count?: number;
    game_engines?: IdNamePair[];
    player_perspectives?: IdNamePair[];
    cover?: {
        id: number;
        image_id: string;
    }
    involved_companies?: {
        id: number;
        developer: boolean;
        publisher: boolean;
        company: IdNamePair;
    }[];
}


// --- JIKAN Provider Types --------------------------------------------------------------

interface JikanNamedObject {
    url: string;
    name: string;
    type: string;
    mal_id: number;
}


export interface JikanAnime {
    url: string;
    title: string;
    type?: string;
    rank?: number;
    year?: number;
    mal_id: number;
    status: string;
    score?: number;
    airing: boolean;
    source?: string;
    season?: string;
    episodes?: number;
    synopsis?: string;
    popularity?: number;
    title_english?: string;
    title_japanese?: string;
    genres: JikanNamedObject[];
    themes: JikanNamedObject[];
    demographics: JikanNamedObject[];
    aired: {
        from: string;
        to?: string | null;
    };
    images: {
        jpg: {
            image_url: string;
            small_image_url: string;
            large_image_url: string;
        },
        webp: {
            image_url: string;
            small_image_url: string;
            large_image_url: string;
        },
    };
}


export interface JikanAnimeSearchResponse {
    pagination: {
        current_page: number;
        has_next_page: boolean;
        last_visible_page: number;
        items: {
            count: number;
            total: number;
            per_page: number;
        };
    };
    data: JikanAnime[];
}


// --- TMDB Provider Types --------------------------------------------------------------

export interface TmdbPaginatedResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}


interface TmdbBaseSearchResult {
    id: number;
    adult?: boolean;
    overview: string;
    popularity: number;
    vote_count: number;
    genre_ids: number[];
    vote_average: number;
    original_language: string;
    poster_path: string | null;
    backdrop_path: string | null;
}


export interface TmdbMovieSearchResult extends TmdbBaseSearchResult {
    title: string;
    media_type: "movie";
    release_date: string;
    original_title: string;
}


export interface TmdbTvSearchResult extends TmdbBaseSearchResult {
    name: string;
    media_type: "tv";
    original_name: string;
    first_air_date: string;
    origin_country: string[];
}


export type TmdbTrendingTvResponse = TmdbPaginatedResponse<TmdbTvSearchResult>;
export type TmdbTrendingMoviesResponse = TmdbPaginatedResponse<TmdbMovieSearchResult>;
export type TmdbMultiSearchResponse = TmdbPaginatedResponse<TmdbMovieSearchResult | TmdbTvSearchResult | { media_type: "person" }>;


export interface TmdbMovieDetails {
    id: number;
    title: string;
    adult: boolean;
    budget: number;
    status: string;
    tagline: string;
    runtime: number;
    imdb_id: string;
    revenue: number;
    homepage: string;
    overview: string;
    vote_count: number;
    popularity: number;
    vote_average: number;
    genres: IdNamePair[];
    release_date: string;
    original_title: string;
    original_language: string;
    poster_path: string | null;
    backdrop_path: string | null;
    belongs_to_collection: {
        id: number,
        name: string,
        poster_path: string,
        backdrop_path: string,
    } | null;
    credits: {
        cast: {
            id: number;
            name: string;
            order: number;
            character: string;
            profile_path: string | null;
        }[];
        crew: {
            id: number;
            name: string;
            department: string;
            profile_path: string | null;
            job: "Director" | "Original Music Composer";
        }[];
    };
}


export interface CreatedBy {
    id: number;
    name: string;
    gender: number;
    credit_id: string;
    original_name: string;
    profile_path: string | null;
}


interface Network {
    id: number;
    name: string;
    origin_country: string;
    logo_path: string | null;
}


interface Episode {
    id: number;
    name: string;
    runtime: number;
    show_id: number;
    overview: string;
    air_date: string;
    vote_count: number;
    vote_average: number;
    episode_type: string;
    season_number: number;
    episode_number: number;
    production_code: string;
    still_path: string | null;
}


interface Season {
    id: number;
    name: string;
    air_date: string;
    overview: string;
    vote_average: number;
    episode_count: number;
    season_number: number;
    poster_path: string | null;
}


export interface TmdbTvDetails {
    id: number;
    name: string;
    type: string;
    adult: boolean;
    status: string;
    tagline: string;
    homepage: string;
    overview: string;
    vote_count: number;
    popularity: number;
    languages: string[];
    vote_average: number;
    last_air_date: string;
    original_name: string;
    in_production: boolean;
    first_air_date: string;
    origin_country: string[];
    number_of_seasons: number;
    original_language: string;
    episode_run_time: number[];
    poster_path: string | null;
    number_of_episodes: number;
    backdrop_path: string | null;
    seasons: Season[];
    networks: Network[];
    genres: IdNamePair[];
    created_by: CreatedBy[];
    last_episode_to_air: Episode;
    next_episode_to_air: Episode | null;
    credits: {
        cast: {
            id: number,
            name: string,
            order: number,
            gender: number,
            adult: boolean,
            credit_id: string,
            character: string,
            popularity: number,
            profile_path: string,
            original_name: string,
            known_for_department: string,
        }[];
        crew: {
            id: number,
            job: string,
            name: string,
            gender: number,
            adult: boolean,
            credit_id: string,
            popularity: number,
            profile_path: string,
            original_name: string,
            department: "Writing",
            known_for_department: "Writing",
        }[];
    };
}


export interface TmdbChangesResponse {
    page: number;
    total_pages: number;
    total_results: number;
    results: {
        id: number;
        adult: boolean | null;
    }[];
}


// --- Google Books Provider ----------------------------------------------

export interface GBooksSearchResults {
    kind: string;
    totalItems: number;
    items: GBooksSearchDetails[];
}


export interface GBooksSearchDetails {
    id: string;
    kind: string;
    etag: string;
    selfLink: string;
    volumeInfo: {
        title: string;
        subtitle: string;
        authors: string[];
        publisher: string;
        publishedDate: string;
        description: string;
        pageCount: number;
        printType: string;
        categories: string[];
        maturityRating: string;
        imageLinks: {
            thumbnail: string;
            smallThumbnail: string;
        };
        language: string;
        previewLink: string;
        infoLink: string;
        canonicalVolumeLink: string;
    };
}


export interface GBooksMoreImageLinks {
    thumbnail: string;
    smallThumbnail: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
}


export interface GBooksMoreVolumeInfo extends Omit<GBooksSearchDetails["volumeInfo"], "imageLinks"> {
    imageLinks: GBooksMoreImageLinks;
}


export interface GBooksDetails extends Omit<GBooksSearchDetails, "volumeInfo"> {
    volumeInfo: GBooksMoreVolumeInfo;
}