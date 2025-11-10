// --- USERS ------------------------------------------------------------------------

export const RoleType = {
    MANAGER: "manager",
    USER: "user",
} as const;
export type RoleType = (typeof RoleType)[keyof typeof RoleType];


export const PrivacyType = {
    PUBLIC: "public",
    RESTRICTED: "restricted",
    PRIVATE: "private",
} as const;
export type PrivacyType = (typeof PrivacyType)[keyof typeof PrivacyType];


export const RatingSystemType = {
    SCORE: "score",
    FEELING: "feeling",
} as const;
export type RatingSystemType = (typeof RatingSystemType)[keyof typeof RatingSystemType];


// --- MEDIA ------------------------------------------------------------------------


export const MediaType = {
    SERIES: "series",
    ANIME: "anime",
    MOVIES: "movies",
    BOOKS: "books",
    GAMES: "games",
    MANGA: "manga",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];


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
} as const;
export type Status = (typeof Status)[keyof typeof Status];


export const LabelAction = {
    ADD: "add",
    RENAME: "rename",
    DELETE_ONE: "deleteOne",
    DELETE_ALL: "deleteAll",
} as const;
export type LabelAction = (typeof LabelAction)[keyof typeof LabelAction];

export const JobType = {
    ACTOR: "actor",
    CREATOR: "creator",
    PLATFORM: "platform",
    PUBLISHER: "publisher",
    COMPOSITOR: "compositor",
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];


export const GamesPlatformsEnum = {
    PC: "PC",
    ANDROID: "Android",
    IPHONE: "Iphone",
    PLAYSTATION_5: "Playstation 5",
    PLAYSTATION_4: "Playstation 4",
    PLAYSTATION_3: "Playstation 3",
    PLAYSTATION_2: "Playstation 2",
    PLAYSTATION: "Playstation",
    PSP: "PSP",
    PS_VITA: "PS Vita",
    XBOX_SERIES: "Xbox Series",
    XBOX_ONE: "Xbox One",
    XBOX_360: "Xbox 360",
    XBOX: "Xbox",
    NINTENDO_SWITCH_2: "Switch 2",
    NINTENDO_SWITCH: "Switch",
    WII_U: "Wii U",
    WII: "Wii",
    GAMECUBE: "Gamecube",
    NINTENDO_64: "Nintendo 64",
    SNES: "SNES",
    NES: "NES",
    NINTENDO_3DS: "Nintendo 3DS",
    NINTENDO_DS: "Nintendo DS",
    GAME_BOY_ADVANCE: "GB Advance",
    GAME_BOY_COLOR: "GB Color",
    GAME_BOY: "Game Boy",
    ARCADE: "Arcade",
    OLD_SEGA_CONSOLE: "Old Sega",
    OLD_ATARI_CONSOLE: "Old Atari",
    OTHER: "Other",
} as const;
export type GamesPlatformsEnum = (typeof GamesPlatformsEnum)[keyof typeof GamesPlatformsEnum];


// --- OTHER ------------------------------------------------------------------------

export const NotificationType = {
    TV: "tv",
    MEDIA: "media",
    FOLLOW: "follow",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];


export const UpdateType = {
    TV: "tv",
    PAGE: "page",
    REDO: "redo",
    RATING: "rating",
    STATUS: "status",
    CHAPTER: "chapter",
    COMMENT: "comment",
    PLAYTIME: "playtime",
    FAVORITE: "favorite",
    PLATFORM: "platform",
} as const;
export type UpdateType = (typeof UpdateType)[keyof typeof UpdateType];


export const AchievementDifficulty = {
    BRONZE: "bronze",
    SILVER: "silver",
    GOLD: "gold",
    PLATINUM: "platinum",
} as const;
export type AchievementDifficulty = (typeof AchievementDifficulty)[keyof typeof AchievementDifficulty];


export const ApiProviderType = {
    TMDB: "tmdb",
    BOOKS: "books",
    IGDB: "igdb",
    MANGA: "manga",
    USERS: "users",
} as const;
export type ApiProviderType = (typeof ApiProviderType)[keyof typeof ApiProviderType];
