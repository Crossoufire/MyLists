import {sql} from "drizzle-orm";
import {user} from "./auth.schema";
import {customJson, imageUrl} from "@/lib/server/database/custom-types";
import {index, integer, real, sqliteTable, text} from "drizzle-orm/sqlite-core"
import {AchievementDifficulty, GamesPlatformsEnum, MediaType, NotificationType, Status, UpdateType} from "@/lib/server/utils/enums";


const BASE_SERIES_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/series-covers`;
const BASE_ANIME_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/anime-covers`;
const BASE_MOVIES_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/movies-covers`;
const BASE_GAMES_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/games-covers`;
const BASE_BOOKS_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/books-covers`;
const BASE_MANGA_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/manga-covers`;


export const followers = sqliteTable("followers", {
    followerId: integer().references(() => user.id),
    followedId: integer().references(() => user.id),
});

export const animeActors = sqliteTable("anime_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});

export const animeEpisodesPerSeason = sqliteTable("anime_episodes_per_season", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    season: integer().notNull(),
    episodes: integer().notNull(),
});

export const moviesActors = sqliteTable("movies_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => movies.id),
    name: text().notNull(),
});

export const seriesActors = sqliteTable("series_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});

export const seriesEpisodesPerSeason = sqliteTable("series_episodes_per_season", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    season: integer().notNull(),
    episodes: integer().notNull(),
});

export const gamesPlatforms = sqliteTable("games_platforms", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
});

export const gamesCompanies = sqliteTable("games_companies", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
    publisher: integer({ mode: "boolean" }),
    developer: integer({ mode: "boolean" }),
});

export const booksAuthors = sqliteTable("books_authors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => books.id),
    name: text().notNull(),
});

export const userMediaUpdate = sqliteTable("user_media_update", {
        id: integer().primaryKey().notNull(),
        userId: integer().notNull().references(() => user.id),
        mediaId: integer().notNull(),
        mediaName: text().notNull(),
        mediaType: text().$type<MediaType>().notNull(),
        updateType: text().$type<UpdateType>().notNull(),
        payload: customJson<Record<string, any>>("payload"),
        timestamp: text().notNull(),
    },
    (table) => [
        index("ix_user_media_update_media_id").on(table.mediaId),
        index("ix_user_media_update_timestamp").on(table.timestamp),
        index("ix_user_media_update_media_type").on(table.mediaType),
        index("ix_user_media_update_user_id").on(table.userId),
    ]);

export const books = sqliteTable("books", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    releaseDate: text(),
    pages: integer().notNull(),
    language: text(),
    publishers: text(),
    synopsis: text(),
    imageCover: imageUrl("image_cover", BASE_BOOKS_COVERS_PATH).notNull(),
    apiId: text(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});

export const seriesGenre = sqliteTable("series_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});

export const animeGenre = sqliteTable("anime_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});

export const moviesGenre = sqliteTable("movies_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => movies.id),
    name: text().notNull(),
});

export const gamesGenre = sqliteTable("games_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
});

export const booksGenre = sqliteTable("books_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => books.id),
    name: text().notNull(),
});

export const seriesLabels = sqliteTable("series_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});

export const animeLabels = sqliteTable("anime_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});

export const moviesLabels = sqliteTable("movies_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => movies.id),
    name: text().notNull(),
});

export const gamesLabels = sqliteTable("games_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => games.id),
    name: text().notNull(),
});

export const booksLabels = sqliteTable("books_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => books.id),
    name: text().notNull(),
});

export const notifications = sqliteTable("notifications", {
        id: integer().primaryKey().notNull(),
        userId: integer().references(() => user.id),
        mediaType: text().$type<MediaType>(),
        mediaId: integer(),
        payload: customJson<Record<string, any>>("payload").notNull(),
        timestamp: text().default(sql`(CURRENT_TIMESTAMP)`).notNull(),
        notificationType: text().$type<NotificationType>(),
    },
    (table) => [index("ix_notifications_timestamp").on(table.timestamp)]);

export const series = sqliteTable("series", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text(),
    releaseDate: text(),
    lastAirDate: text(),
    homepage: text(),
    createdBy: text(),
    duration: integer().notNull(),
    totalSeasons: integer().notNull(),
    totalEpisodes: integer().notNull(),
    originCountry: text(),
    prodStatus: text(),
    voteAverage: real(),
    voteCount: real(),
    synopsis: text(),
    popularity: real(),
    imageCover: imageUrl("image_cover", BASE_SERIES_COVERS_PATH).notNull(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    episodeToAir: integer(),
    seasonToAir: integer(),
    nextEpisodeToAir: text(),
    lastApiUpdate: text(),
});

export const seriesNetwork = sqliteTable("series_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => series.id),
    name: text().notNull(),
});

export const anime = sqliteTable("anime", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text(),
    releaseDate: text(),
    lastAirDate: text(),
    homepage: text(),
    createdBy: text(),
    duration: integer().notNull(),
    totalSeasons: integer().notNull(),
    totalEpisodes: integer().notNull(),
    originCountry: text(),
    prodStatus: text(),
    voteAverage: real(),
    voteCount: real(),
    synopsis: text(),
    popularity: real(),
    imageCover: imageUrl("image_cover", BASE_ANIME_COVERS_PATH).notNull(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    seasonToAir: integer(),
    episodeToAir: integer(),
    nextEpisodeToAir: text(),
    lastApiUpdate: text(),
});

export const animeNetwork = sqliteTable("anime_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => anime.id),
    name: text().notNull(),
});

export const games = sqliteTable("games", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    imageCover: imageUrl("image_cover", BASE_GAMES_COVERS_PATH).notNull(),
    gameEngine: text(),
    gameModes: text(),
    playerPerspective: text(),
    voteAverage: real(),
    voteCount: real(),
    releaseDate: text(),
    synopsis: text(),
    igdbUrl: text(),
    hltbMainTime: real(),
    hltbMainAndExtraTime: real(),
    hltbTotalCompleteTime: real(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});

export const achievement = sqliteTable("achievement", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    codeName: text().notNull(),
    description: text().notNull(),
    mediaType: text().$type<MediaType>(),
    value: text(),
});

export const dailyMediadle = sqliteTable("daily_mediadle", {
    id: integer().primaryKey().notNull(),
    mediaType: text().$type<MediaType>().notNull(),
    mediaId: integer().notNull(),
    date: text().notNull(),
    pixelationLevels: integer().default(5),
});

export const mediadleStats = sqliteTable("mediadle_stats", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaType: text().$type<MediaType>().notNull(),
    totalPlayed: integer(),
    totalWon: integer(),
    averageAttempts: real(),
    streak: integer(),
    bestStreak: integer(),
});

export const achievementTier = sqliteTable("achievement_tier", {
    id: integer().primaryKey().notNull(),
    achievementId: integer().notNull().references(() => achievement.id),
    difficulty: text().$type<AchievementDifficulty>().notNull(),
    criteria: customJson<{ count: number }>("criteria").notNull(),
    rarity: real(),
});

export const userMediadleProgress = sqliteTable("user_mediadle_progress", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    dailyMediadleId: integer().notNull().references(() => dailyMediadle.id),
    attempts: integer().default(0),
    completed: integer({ mode: "boolean" }).default(false),
    succeeded: integer({ mode: "boolean" }).default(false),
    completionTime: text(),
});

export const userAchievement = sqliteTable("user_achievement", {
    id: integer().primaryKey().notNull(),
    userId: integer().references(() => user.id),
    achievementId: integer().references(() => achievement.id),
    tierId: integer().references(() => achievementTier.id),
    progress: real(),
    count: real(),
    completed: integer({ mode: "boolean" }),
    completedAt: text(),
    lastCalculatedAt: text(),
});

export const manga = sqliteTable("manga", {
    id: integer().primaryKey().notNull(),
    originalName: text(),
    chapters: integer(),
    prodStatus: text(),
    siteUrl: text(),
    endDate: text(),
    volumes: integer(),
    voteAverage: real(),
    voteCount: real(),
    popularity: real(),
    publishers: text(),
    name: text().notNull(),
    synopsis: text(),
    releaseDate: text(),
    imageCover: imageUrl("image_cover", BASE_MANGA_COVERS_PATH).notNull(),
    apiId: integer().notNull(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});

export const mangaList = sqliteTable("manga_list", {
        id: integer().primaryKey().notNull(),
        mediaId: integer().notNull().references(() => manga.id),
        userId: integer().notNull().references(() => user.id),
        currentChapter: integer().notNull(),
        total: integer(),
        redo: integer().notNull().default(0),
        status: text().$type<Status>().notNull(),
        rating: real(),
        favorite: integer({ mode: "boolean" }),
        comment: text(),
    },
    (table) => [
        index("ix_manga_list_user_id").on(table.userId),
        index("ix_manga_list_id").on(table.id),
    ]);

export const mangaAuthors = sqliteTable("manga_authors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer().notNull().references(() => manga.id),
    name: text().notNull(),
});

export const mangaGenre = sqliteTable("manga_genre", {
    mediaId: integer().notNull().references(() => manga.id),
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
});

export const mangaLabels = sqliteTable("manga_labels", {
        mediaId: integer().notNull().references(() => manga.id),
        id: integer().primaryKey().notNull(),
        userId: integer().notNull().references(() => user.id),
        name: text().notNull(),
    },
    (table) => [index("ix_manga_labels_user_id").on(table.userId)]);

export const moviesList = sqliteTable("movies_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => movies.id),
    status: text().$type<Status>().notNull(),
    redo: integer().default(0),
    comment: text(),
    total: integer().default(0),
    rating: real(),
    favorite: integer({ mode: "boolean" }),
});

export const gamesList = sqliteTable("games_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => games.id),
    status: text().$type<Status>().notNull(),
    playtime: integer().default(0),
    favorite: integer({ mode: "boolean" }),
    comment: text(),
    platform: text().$type<GamesPlatformsEnum>(),
    rating: real(),
});

export const booksList = sqliteTable("books_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => books.id),
    status: text().$type<Status>().notNull(),
    redo: integer().default(0),
    actualPage: integer(),
    total: integer().default(0),
    comment: text(),
    rating: real(),
    favorite: integer({ mode: "boolean" }),
});


export const userMediaSettings = sqliteTable("user_media_settings", {
        id: integer().primaryKey().notNull(),
        userId: integer().notNull().references(() => user.id),
        mediaType: text().$type<MediaType>().notNull(),
        timeSpent: integer().notNull(),
        views: integer().notNull(),
        active: integer({ mode: "boolean" }).notNull(),
        totalEntries: integer().default(0).notNull(),
        totalRedo: integer().default(0).notNull(),
        entriesRated: integer().default(0).notNull(),
        sumEntriesRated: integer().default(0).notNull(),
        entriesCommented: integer().default(0).notNull(),
        entriesFavorites: integer().default(0).notNull(),
        totalSpecific: integer().default(0).notNull(),
        statusCounts: customJson<Record<Partial<Status>, number>>("status_counts").default(sql`'{}'`).notNull(),
        averageRating: real(),
    },
    (table) => [
        index("ix_user_media_settings_user_id").on(table.userId),
        index("ix_user_media_settings_media_type").on(table.mediaType),
    ]);

export const animeList = sqliteTable("anime_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => anime.id),
    currentSeason: integer().notNull(),
    lastEpisodeWatched: integer().notNull(),
    status: text().$type<Status>().notNull(),
    favorite: integer({ mode: "boolean" }),
    redo: integer().default(0),
    comment: text(),
    total: integer().default(0),
    rating: real(),
    redo2: customJson<number[]>("redo2").default(sql`'[]'`).notNull(),
});

export const seriesList = sqliteTable("series_list", {
    id: integer().primaryKey().notNull(),
    userId: integer().notNull().references(() => user.id),
    mediaId: integer().notNull().references(() => series.id),
    currentSeason: integer().notNull(),
    lastEpisodeWatched: integer().notNull(),
    status: text().$type<Status>().notNull(),
    favorite: integer({ mode: "boolean" }),
    redo: integer().default(0),
    comment: text(),
    total: integer().default(0),
    rating: real(),
    redo2: customJson<number[]>("redo2").default(sql`'[]'`).notNull(),
});

export const movies = sqliteTable("movies", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text(),
    releaseDate: text(),
    homepage: text(),
    duration: integer().notNull(),
    originalLanguage: text(),
    synopsis: text(),
    voteAverage: real(),
    voteCount: real(),
    popularity: real(),
    budget: real(),
    revenue: real(),
    tagline: text(),
    imageCover: imageUrl("image_cover", BASE_MOVIES_COVERS_PATH).notNull(),
    apiId: integer().notNull(),
    collectionId: integer(),
    directorName: text(),
    compositorName: text(),
    lockStatus: integer({ mode: "boolean" }),
    lastApiUpdate: text(),
});
