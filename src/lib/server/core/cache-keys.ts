import {MediaType} from "@/lib/utils/enums";


export const ONE_HOUR_CACHE_TTL_MS = 60 * 60 * 1000;

export const ONE_DAY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const getTrendsCacheKey = () => {
    return "$trends:v2:null";
};

export const getPlatformStatsCacheKey = (data?: { mediaType?: MediaType } | null) => {
    return `platformStats:v2:${JSON.stringify(data ?? null)}`;
};

export const getUserStatsCacheKey = (userId: number, data?: { mediaType?: MediaType } | null) => {
    return `userStats:v2:${userId}:${JSON.stringify(data ?? null)}`;
};
