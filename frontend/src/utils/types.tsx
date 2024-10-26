import {UseMutationResult} from "@tanstack/react-query";


export type Role = "manager" | "user";

export type Rating = "feeling" | "score";

export type Privacy = "public" | "restricted" | "private";

export type SearchSelector = "tmdb" | "igdb" | "books" | "users";

export type TierDifficulty = "bronze" | "silver" | "gold" | "platinum";

export type MediaType = "series" | "anime" | "movies" | "games" | "books";

export type MediaStatus = "Playing" | "Reading" | "Watching" | "Completed" | "On Hold" | "Multiplayer" | "Endless" | "Random" |
    "Dropped" | "Plan to Watch" | "Plan to Read" | "Plan to Play";


export interface ApiResponse {
    ok: boolean;
    status: number;
    body: Record<string, any>;
}


export interface User {
    id: number;
    username: string;
    email: string;
    registered_on: string;
    profile_image: string;
    back_image: string;
    privacy: Privacy;
    active: boolean;
    role: Role;
    transition_email: string;
    activated_on: string;
    last_notif_read_time: string;
    last_seen: string;
    show_update_modal: boolean;
    grid_list_view: boolean;
    profile_views: number;
    add_feeling: boolean;
    profile_level: number;
    followers_count: number;
    settings: { [K in MediaType]: UserSettings }
}


export interface UserSettings {
    media_type: MediaType;
    time_spent: number;
    active: boolean;
    level: number;
    views: number;
}


export interface UserMediaParams {
    media_id?: number;
    rating?: { value: number };
    comment?: string;
    favorite?: boolean;
    redo?: number;
    playtime?: number;
    page?: number;
    platform?: string;
    current_season?: number;
    last_episode_watched?: number;
}


export interface LoginData extends ApiResponse {
    body: {
        data: User,
        access_token: string,
    }
}


export interface UseAuthReturn {
    currentUser: User | null | undefined;
    isLoading: boolean,
    setCurrentUser: (updates: User | null) => void;
    login: UseMutationResult<LoginData, Error, { username: string; password: string }>;
    oAuth2Login: UseMutationResult<LoginData, Error, { provider: string; data: any }>;
    logout: UseMutationResult;
    register: UseMutationResult<any, any, { data: any }>;
}


export interface MediaStatsItem {
    media_type: MediaType;
    total_media: number;
    total_media_no_plan_to_x: number;
    media_metric: number;
    mean_metric: number;
    time_days: number;
    specific_total: number;
    no_data: boolean;
    total_favorites: number;
    status_count: Array<{
        status: MediaStatus;
        count: number;
        percent: number;
    }>;
    favorites: Array<{
        media_id: number;
        media_name: string;
        media_cover: string;
    }>
}
