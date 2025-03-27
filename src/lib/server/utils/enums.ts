export const MediaType = {
    ANIME: "anime",
    BOOKS: "books",
    GAMES: "games",
    MOVIES: "movies",
    SERIES: "series",
} as const;

type MediaTypeValues<T> = T[keyof T];
export type MediaType = MediaTypeValues<typeof MediaType>;


export const Privacy = {
    PUBLIC: "public",
    RESTRICTED: "restricted",
    PRIVATE: "private",
} as const;

type PrivacyValues<T> = T[keyof T];
export type Privacy = PrivacyValues<typeof Privacy>;


export const Status = {
    READING: "Reading",
    PLAYING: "Playing",
    WATCHING: "Watching",
    COMPLETED: "Completed",
    MULTIPLAYER: "Multiplayer",
    ENDLESS: "Endless",
    ON_HOLD: "On Hold",
    RANDOM: "Random",
    DROPPED: "Dropped",
    PLAN_TO_WATCH: "Plan to Watch",
    PLAN_TO_PLAY: "Plan to Play",
    PLAN_TO_READ: "Plan to Read",
    getNoPlanTo: () => [Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ],
} as const;

type StatusValues<T> = T[keyof T];
export type Status = StatusValues<typeof Status>;
