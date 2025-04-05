import {sql} from "drizzle-orm";
import {user} from "./auth.schema";
import {customJson, imageUrl} from "@/lib/server/database/custom-types";
import {index, integer, numeric, real, sqliteTable, text} from "drizzle-orm/sqlite-core"
import {AchievementDifficulty, MediaType, NotificationType, Status, UpdateType} from "@/lib/server/utils/enums";


const BASE_SERIES_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/series-covers`;
const BASE_ANIME_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/anime-covers`;
const BASE_MOVIES_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/movies-covers`;
const BASE_GAMES_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/games-covers`;
const BASE_BOOKS_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/books-covers`;
const BASE_MANGA_COVERS_PATH = `${process.env.VITE_BASE_URL}/static/covers/manga-covers`;


export const followers = sqliteTable("followers", {
    followerId: integer("follower_id").references(() => user.id),
    followedId: integer("followed_id").references(() => user.id),
});

export const animeActors = sqliteTable("anime_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    name: text(),
});

export const animeEpisodesPerSeason = sqliteTable("anime_episodes_per_season", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    season: integer().notNull(),
    episodes: integer().notNull(),
});

export const moviesActors = sqliteTable("movies_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => movies.id),
    name: text(),
});

export const seriesActors = sqliteTable("series_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => series.id),
    name: text(),
});

export const seriesEpisodesPerSeason = sqliteTable("series_episodes_per_season", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => series.id),
    season: integer().notNull(),
    episodes: integer().notNull(),
});

export const gamesPlatforms = sqliteTable("games_platforms", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => games.id),
    name: text(),
});

export const gamesCompanies = sqliteTable("games_companies", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => games.id),
    name: text(),
    publisher: numeric(),
    developer: numeric(),
});

export const booksAuthors = sqliteTable("books_authors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => books.id),
    name: text(),
});

export const userMediaUpdate = sqliteTable("user_media_update", {
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").notNull().references(() => user.id),
        mediaId: integer("media_id").notNull(),
        mediaName: text("media_name").notNull(),
        mediaType: text("media_type").$type<MediaType>().notNull(),
        updateType: text("update_type").$type<UpdateType>().notNull(),
        payload: customJson<Record<string, any>>("payload"),
        timestamp: numeric().notNull(),
    },
    (table) => [
        index("ix_user_media_update_media_id").on(table.mediaId),
        index("ix_user_media_update_timestamp").on(table.timestamp),
        index("ix_user_media_update_media_type").on(table.mediaType),
        index("ix_user_media_update_user_id").on(table.userId),
    ]);

export const token = sqliteTable("token", {
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").references(() => user.id),
        accessToken: text("access_token").notNull(),
        accessExpiration: numeric("access_expiration").notNull(),
        refreshToken: text("refresh_token").notNull(),
        refreshExpiration: numeric("refresh_expiration").notNull(),
    },
    (table) => [
        index("ix_token_user_id").on(table.userId),
        index("ix_token_access_token").on(table.accessToken),
        index("ix_token_refresh_token").on(table.refreshToken),
    ]);

export const books = sqliteTable("books", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    releaseDate: text("release_date"),
    pages: integer().notNull(),
    language: text(),
    publishers: text(),
    synopsis: text(),
    imageCover: imageUrl("image_cover", BASE_BOOKS_COVERS_PATH).notNull(),
    apiId: text("api_id"),
    lockStatus: numeric("lock_status"),
    lastApiUpdate: numeric("last_api_update"),
});

export const seriesGenre = sqliteTable("series_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => series.id),
    name: text().notNull(),
});

export const animeGenre = sqliteTable("anime_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    name: text().notNull(),
});

export const moviesGenre = sqliteTable("movies_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => movies.id),
    name: text().notNull(),
});

export const gamesGenre = sqliteTable("games_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => games.id),
    name: text().notNull(),
});

export const booksGenre = sqliteTable("books_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => books.id),
    name: text().notNull(),
});

export const seriesLabels = sqliteTable("series_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => series.id),
    name: text().notNull(),
});

export const animeLabels = sqliteTable("anime_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    name: text().notNull(),
});

export const moviesLabels = sqliteTable("movies_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => movies.id),
    name: text().notNull(),
});

export const gamesLabels = sqliteTable("games_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => games.id),
    name: text().notNull(),
});

export const booksLabels = sqliteTable("books_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => books.id),
    name: text().notNull(),
});

export const notifications = sqliteTable("notifications", {
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").references(() => user.id),
        mediaType: text("media_type").$type<MediaType>(),
        mediaId: integer("media_id"),
        payload: text(),
        timestamp: numeric(),
        notificationType: text("notification_type").$type<NotificationType>(),
    },
    (table) => [
        index("ix_notifications_timestamp").on(table.timestamp),
    ]);

export const series = sqliteTable("series", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text("original_name"),
    releaseDate: text("release_date"),
    lastAirDate: text("last_air_date"),
    homepage: text(),
    createdBy: text("created_by"),
    duration: integer(),
    totalSeasons: integer("total_seasons"),
    totalEpisodes: integer("total_episodes"),
    originCountry: text("origin_country"),
    prodStatus: text("prod_status"),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    synopsis: text(),
    popularity: real(),
    imageCover: imageUrl("image_cover", BASE_SERIES_COVERS_PATH).notNull(),
    apiId: text("api_id").notNull(),
    lockStatus: numeric("lock_status"),
    episodeToAir: integer("episode_to_air"),
    seasonToAir: integer("season_to_air"),
    nextEpisodeToAir: text("next_episode_to_air"),
    lastApiUpdate: numeric("last_api_update"),
});

export const seriesNetwork = sqliteTable("series_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => series.id),
    name: text().notNull(),
});

export const anime = sqliteTable("anime", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text("original_name"),
    releaseDate: text("release_date"),
    lastAirDate: text("last_air_date"),
    homepage: text(),
    createdBy: text("created_by"),
    duration: integer(),
    totalSeasons: integer("total_seasons"),
    totalEpisodes: integer("total_episodes"),
    originCountry: text("origin_country"),
    prodStatus: text("prod_status"),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    synopsis: text(),
    popularity: real(),
    imageCover: imageUrl("image_cover", BASE_ANIME_COVERS_PATH).notNull(),
    apiId: text("api_id").notNull(),
    lockStatus: numeric("lock_status"),
    seasonToAir: integer("season_to_air"),
    episodeToAir: integer("episode_to_air"),
    nextEpisodeToAir: text("next_episode_to_air"),
    lastApiUpdate: numeric("last_api_update"),
});

export const animeNetwork = sqliteTable("anime_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    name: text().notNull(),
});

export const games = sqliteTable("games", {
    id: integer().primaryKey().notNull(),
    name: text(),
    imageCover: imageUrl("image_cover", BASE_GAMES_COVERS_PATH).notNull(),
    gameEngine: text("game_engine"),
    gameModes: text("game_modes"),
    playerPerspective: text("player_perspective"),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    releaseDate: integer("release_date"),
    synopsis: text(),
    igdbUrl: text("IGDB_url"),
    hltbMainTime: text("hltb_main_time"),
    hltbMainAndExtraTime: text("hltb_main_and_extra_time"),
    hltbTotalCompleteTime: text("hltb_total_complete_time"),
    apiId: text("api_id"),
    lockStatus: integer("lock_status"),
    lastApiUpdate: numeric("last_api_update"),
});

export const achievement = sqliteTable("achievement", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    codeName: text("code_name").notNull(),
    description: text().notNull(),
    mediaType: text("media_type").$type<MediaType>(),
    value: text(),
});

export const dailyMediadle = sqliteTable("daily_mediadle", {
    id: integer().primaryKey().notNull(),
    mediaType: text("media_type").$type<MediaType>().notNull(),
    mediaId: integer("media_id").notNull(),
    date: numeric().notNull(),
    pixelationLevels: integer("pixelation_levels"),
});

export const mediadleStats = sqliteTable("mediadle_stats", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaType: text("media_type").$type<MediaType>().notNull(),
    totalPlayed: integer("total_played"),
    totalWon: integer("total_won"),
    averageAttempts: real("average_attempts"),
    streak: integer(),
    bestStreak: integer("best_streak"),
});

export const achievementTier = sqliteTable("achievement_tier", {
    id: integer().primaryKey().notNull(),
    achievementId: integer("achievement_id").notNull().references(() => achievement.id),
    difficulty: text().$type<AchievementDifficulty>().notNull(),
    criteria: numeric().notNull(),
    rarity: real(),
});

export const userMediadleProgress = sqliteTable("user_mediadle_progress", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    dailyMediadleId: integer("daily_mediadle_id").notNull().references(() => dailyMediadle.id),
    attempts: integer(),
    completed: numeric(),
    succeeded: numeric(),
    completionTime: numeric("completion_time"),
});

export const userAchievement = sqliteTable("user_achievement", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").references(() => user.id),
    achievementId: integer("achievement_id").references(() => achievement.id),
    tierId: integer("tier_id").references(() => achievementTier.id),
    progress: real(),
    count: real(),
    completed: integer({ mode: "boolean" }),
    completedAt: numeric("completed_at"),
    lastCalculatedAt: numeric("last_calculated_at"),
});

export const manga = sqliteTable("manga", {
    originalName: text("original_name"),
    chapters: integer(),
    prodStatus: text("prod_status"),
    siteUrl: text("site_url"),
    endDate: text("end_date"),
    volumes: integer(),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    popularity: real(),
    publishers: text(),
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    synopsis: text(),
    releaseDate: text("release_date"),
    imageCover: imageUrl("image_cover", BASE_MANGA_COVERS_PATH).notNull(),
    apiId: text("api_id").notNull(),
    lockStatus: numeric("lock_status").notNull(),
    lastApiUpdate: numeric("last_api_update"),
});

export const mangaList = sqliteTable("manga_list", {
        mediaId: integer("media_id").notNull().references(() => manga.id),
        currentChapter: integer("current_chapter").notNull(),
        redo: integer().notNull(),
        total: integer(),
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").notNull().references(() => user.id),
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
    mediaId: integer("media_id").notNull().references(() => manga.id),
    name: text(),
});

export const mangaGenre = sqliteTable("manga_genre", {
    mediaId: integer("media_id").notNull().references(() => manga.id),
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
});

export const mangaLabels = sqliteTable("manga_labels", {
        mediaId: integer("media_id").notNull().references(() => manga.id),
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").notNull().references(() => user.id),
        name: text().notNull(),
    },
    (table) => [index("ix_manga_labels_user_id").on(table.userId)]);

export const moviesList = sqliteTable("movies_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => movies.id),
    status: text("status").$type<Status>().notNull(),
    favorite: integer({ mode: "boolean" }),
    redo: integer().default(0),
    comment: text(),
    total: integer(),
    rating: real(),
});

export const gamesList = sqliteTable("games_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => games.id),
    status: text().$type<Status>().notNull(),
    playtime: integer(),
    favorite: integer({ mode: "boolean" }),
    comment: text(),
    platform: text(),
    rating: real(),
});

export const booksList = sqliteTable("books_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => books.id),
    status: text().$type<Status>().notNull(),
    redo: integer().default(0),
    actualPage: integer("actual_page"),
    total: integer(),
    favorite: integer({ mode: "boolean" }),
    comment: text(),
    rating: real(),
});


export const userMediaSettings = sqliteTable("user_media_settings", {
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").notNull().references(() => user.id),
        mediaType: text("media_type").$type<MediaType>().notNull(),
        timeSpent: integer("time_spent").notNull(),
        views: integer().notNull(),
        active: integer("active", { mode: "boolean" }).notNull(),
        totalEntries: integer("total_entries").default(0).notNull(),
        totalRedo: integer("total_redo").default(0).notNull(),
        entriesRated: integer("entries_rated").default(0).notNull(),
        sumEntriesRated: integer("sum_entries_rated").default(0).notNull(),
        entriesCommented: integer("entries_commented").default(0).notNull(),
        entriesFavorites: integer("entries_favorites").default(0).notNull(),
        totalSpecific: integer("total_specific").default(0).notNull(),
        statusCounts: customJson<Record<Partial<Status>, number>>("status_counts").default(sql`'{}'`).notNull(),
        averageRating: real("average_rating"),
    },
    (table) => [
        index("ix_user_media_settings_user_id").on(table.userId),
        index("ix_user_media_settings_media_type").on(table.mediaType),
    ]);

export const animeList = sqliteTable("anime_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    currentSeason: integer("current_season").notNull(),
    lastEpisodeWatched: integer("last_episode_watched").notNull(),
    status: text().$type<Status>().notNull(),
    favorite: integer({ mode: "boolean" }),
    redo: integer().default(0),
    comment: text(),
    total: integer(),
    rating: real(),
    redo2: numeric().default(sql`'[]'`).notNull(),
});

export const seriesList = sqliteTable("series_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => series.id),
    currentSeason: integer("current_season").notNull(),
    lastEpisodeWatched: integer("last_episode_watched").notNull(),
    status: text().$type<Status>().notNull(),
    favorite: integer({ mode: "boolean" }),
    redo: integer().default(0),
    comment: text(),
    total: integer(),
    rating: real(),
    redo2: numeric().default(sql`'[]'`).notNull(),
});

export const movies = sqliteTable("movies", {
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    originalName: text("original_name"),
    releaseDate: text("release_date"),
    homepage: text(),
    duration: integer(),
    originalLanguage: text("original_language"),
    synopsis: text(),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    popularity: real(),
    budget: real(),
    revenue: real(),
    tagline: text(),
    imageCover: imageUrl("image_cover", BASE_MOVIES_COVERS_PATH).notNull(),
    apiId: text("api_id").notNull(),
    collectionId: text("collection_id"),
    directorName: text("director_name"),
    compositorName: text("compositor_name"),
    lockStatus: numeric("lock_status"),
    lastApiUpdate: numeric("last_api_update"),
});
