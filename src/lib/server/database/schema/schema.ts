import {user} from "./auth.schema";
import {index, integer, numeric, real, sqliteTable, text} from "drizzle-orm/sqlite-core"


export const followers = sqliteTable("followers", {
    followerId: integer("follower_id").references(() => user.id),
    followedId: integer("followed_id").references(() => user.id),
});

export const animeActors = sqliteTable("anime_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull(),
    name: text({ length: 100 }),
});

export const animeEpisodesPerSeason = sqliteTable("anime_episodes_per_season", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    season: integer().notNull(),
    episodes: integer().notNull(),
});

export const moviesActors = sqliteTable("movies_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull(),
    name: text({ length: 100 }),
});

export const seriesActors = sqliteTable("series_actors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull(),
    name: text({ length: 100 }),
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
    name: text({ length: 150 }),
});

export const gamesCompanies = sqliteTable("games_companies", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => games.id),
    name: text({ length: 100 }),
    publisher: numeric(),
    developer: numeric(),
});

export const booksAuthors = sqliteTable("books_authors", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => books.id),
    name: text({ length: 150 }),
});

export const userMediaUpdate = sqliteTable("user_media_update", {
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").notNull().references(() => user.id),
        mediaId: integer("media_id").notNull(),
        mediaName: text("media_name").notNull(),
        mediaType: text("media_type", { length: 6 }).notNull(),
        updateType: text("update_type", { length: 8 }).notNull(),
        payload: text().notNull(),
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
        accessToken: text("access_token", { length: 64 }).notNull(),
        accessExpiration: numeric("access_expiration").notNull(),
        refreshToken: text("refresh_token", { length: 64 }).notNull(),
        refreshExpiration: numeric("refresh_expiration").notNull(),
    },
    (table) => [
        index("ix_token_user_id").on(table.userId),
        index("ix_token_access_token").on(table.accessToken),
        index("ix_token_refresh_token").on(table.refreshToken),
    ]);

export const books = sqliteTable("books", {
    id: integer().primaryKey().notNull(),
    name: text({ length: 50 }).notNull(),
    releaseDate: text("release_date", { length: 30 }),
    pages: integer().notNull(),
    language: text({ length: 20 }),
    publishers: text({ length: 50 }),
    synopsis: text(),
    imageCover: text("image_cover", { length: 100 }).notNull(),
    apiId: text("api_id"),
    lockStatus: numeric("lock_status"),
    lastApiUpdate: numeric("last_api_update"),
});

export const seriesGenre = sqliteTable("series_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => series.id),
    name: text({ length: 100 }).notNull(),
});

export const animeGenre = sqliteTable("anime_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    name: text({ length: 100 }).notNull(),
});

export const moviesGenre = sqliteTable("movies_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => movies.id),
    name: text({ length: 100 }).notNull(),
});

export const gamesGenre = sqliteTable("games_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => games.id),
    name: text({ length: 100 }).notNull(),
});

export const booksGenre = sqliteTable("books_genre", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => books.id),
    name: text({ length: 100 }).notNull(),
});

export const seriesLabels = sqliteTable("series_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => series.id),
    name: text({ length: 64 }).notNull(),
});

export const animeLabels = sqliteTable("anime_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    name: text({ length: 64 }).notNull(),
});

export const moviesLabels = sqliteTable("movies_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => movies.id),
    name: text({ length: 64 }).notNull(),
});

export const gamesLabels = sqliteTable("games_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => games.id),
    name: text({ length: 64 }).notNull(),
});

export const booksLabels = sqliteTable("books_labels", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => books.id),
    name: text({ length: 64 }).notNull(),
});

export const notifications = sqliteTable("notifications", {
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").references(() => user.id),
        mediaType: text("media_type", { length: 6 }),
        mediaId: integer("media_id"),
        payload: text(),
        timestamp: numeric(),
        notificationType: text("notification_type", { length: 6 }),
    },
    (table) => [
        index("ix_notifications_timestamp").on(table.timestamp),
    ]);

export const series = sqliteTable("series", {
    id: integer().primaryKey().notNull(),
    name: text({ length: 50 }).notNull(),
    originalName: text("original_name", { length: 50 }),
    releaseDate: text("release_date", { length: 30 }),
    lastAirDate: text("last_air_date", { length: 30 }),
    homepage: text({ length: 200 }),
    createdBy: text("created_by", { length: 30 }),
    duration: integer(),
    totalSeasons: integer("total_seasons"),
    totalEpisodes: integer("total_episodes"),
    originCountry: text("origin_country", { length: 20 }),
    prodStatus: text("prod_status", { length: 50 }),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    synopsis: text(),
    popularity: real(),
    imageCover: text("image_cover", { length: 100 }).notNull(),
    apiId: text("api_id").notNull(),
    lockStatus: numeric("lock_status"),
    episodeToAir: integer("episode_to_air"),
    seasonToAir: integer("season_to_air"),
    nextEpisodeToAir: text("next_episode_to_air", { length: 50 }),
    lastApiUpdate: numeric("last_api_update"),
});

export const seriesNetwork = sqliteTable("series_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => series.id),
    name: text({ length: 150 }).notNull(),
});

export const anime = sqliteTable("anime", {
    id: integer().primaryKey().notNull(),
    name: text({ length: 50 }).notNull(),
    originalName: text("original_name", { length: 50 }),
    releaseDate: text("release_date", { length: 30 }),
    lastAirDate: text("last_air_date", { length: 30 }),
    homepage: text({ length: 200 }),
    createdBy: text("created_by", { length: 30 }),
    duration: integer(),
    totalSeasons: integer("total_seasons"),
    totalEpisodes: integer("total_episodes"),
    originCountry: text("origin_country", { length: 20 }),
    prodStatus: text("prod_status", { length: 50 }),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    synopsis: text(),
    popularity: real(),
    imageCover: text("image_cover", { length: 100 }).notNull(),
    apiId: text("api_id").notNull(),
    lockStatus: numeric("lock_status"),
    seasonToAir: integer("season_to_air"),
    episodeToAir: integer("episode_to_air"),
    nextEpisodeToAir: text("next_episode_to_air", { length: 50 }),
    lastApiUpdate: numeric("last_api_update"),
});

export const animeNetwork = sqliteTable("anime_network", {
    id: integer().primaryKey().notNull(),
    mediaId: integer("media_id").notNull().references(() => anime.id),
    name: text({ length: 150 }).notNull(),
});

export const games = sqliteTable("games", {
    id: integer().primaryKey().notNull(),
    name: text(),
    imageCover: text("image_cover"),
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
    mediaType: text("media_type"),
    value: text(),
});

export const dailyMediadle = sqliteTable("daily_mediadle", {
    id: integer().primaryKey().notNull(),
    mediaType: text("media_type", { length: 6 }).notNull(),
    mediaId: integer("media_id").notNull(),
    date: numeric().notNull(),
    pixelationLevels: integer("pixelation_levels"),
});

export const mediadleStats = sqliteTable("mediadle_stats", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaType: text("media_type", { length: 6 }).notNull(),
    totalPlayed: integer("total_played"),
    totalWon: integer("total_won"),
    averageAttempts: real("average_attempts"),
    streak: integer(),
    bestStreak: integer("best_streak"),
});

export const achievementTier = sqliteTable("achievement_tier", {
    id: integer().primaryKey().notNull(),
    achievementId: integer("achievement_id").notNull().references(() => achievement.id),
    difficulty: text({ length: 8 }).notNull(),
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
    completed: numeric(),
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
    imageCover: text("image_cover").notNull(),
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
        status: text({ length: 13 }).notNull(),
        rating: real(),
        favorite: numeric(),
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
    (table) => [
        index("ix_manga_labels_user_id").on(table.userId),
    ]);

export const moviesList = sqliteTable("movies_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => movies.id),
    status: text({ length: 100 }).notNull(),
    favorite: numeric(),
    redo: integer().default(0),
    comment: text({ length: 500 }),
    total: integer(),
    rating: real(),
});

export const gamesList = sqliteTable("games_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => games.id),
    status: text({ length: 13 }).notNull(),
    playtime: integer(),
    favorite: numeric(),
    comment: text(),
    platform: text({ length: 150 }),
    rating: real(),
});

export const booksList = sqliteTable("books_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => books.id),
    status: text({ length: 100 }).notNull(),
    redo: integer().default(0),
    actualPage: integer("actual_page"),
    total: integer(),
    favorite: numeric(),
    comment: text(),
    rating: real(),
});

export const userMediaSettings = sqliteTable("user_media_settings", {
        id: integer().primaryKey().notNull(),
        userId: integer("user_id").notNull().references(() => user.id),
        mediaType: text("media_type", { length: 6 }).notNull(),
        timeSpent: integer("time_spent").notNull(),
        views: integer().notNull(),
        active: numeric().notNull(),
        totalEntries: integer("total_entries").default(0).notNull(),
        totalRedo: integer("total_redo").default(0).notNull(),
        entriesRated: integer("entries_rated").default(0).notNull(),
        sumEntriesRated: integer("sum_entries_rated").default(0).notNull(),
        entriesCommented: integer("entries_commented").default(0).notNull(),
        entriesFavorites: integer("entries_favorites").default(0).notNull(),
        totalSpecific: integer("total_specific").default(0).notNull(),
        //@ts-ignore
        statusCounts: text("status_counts").default({}).notNull(),
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
    status: text({ length: 100 }).notNull(),
    favorite: numeric(),
    redo: integer().default(0),
    comment: text({ length: 500 }),
    total: integer(),
    rating: real(),
    //@ts-ignore
    redo2: numeric().default([]).notNull(),
});

export const seriesList = sqliteTable("series_list", {
    id: integer().primaryKey().notNull(),
    userId: integer("user_id").notNull().references(() => user.id),
    mediaId: integer("media_id").notNull().references(() => series.id),
    currentSeason: integer("current_season").notNull(),
    lastEpisodeWatched: integer("last_episode_watched").notNull(),
    status: text({ length: 100 }).notNull(),
    favorite: numeric(),
    redo: integer().default(0),
    comment: text({ length: 500 }),
    total: integer(),
    rating: real(),
    //@ts-ignore
    redo2: numeric().default([]).notNull(),
});

export const movies = sqliteTable("movies", {
    id: integer().primaryKey().notNull(),
    name: text({ length: 50 }).notNull(),
    originalName: text("original_name", { length: 50 }),
    releaseDate: text("release_date", { length: 30 }),
    homepage: text({ length: 100 }),
    duration: integer(),
    originalLanguage: text("original_language", { length: 20 }),
    synopsis: text(),
    voteAverage: real("vote_average"),
    voteCount: real("vote_count"),
    popularity: real(),
    budget: real(),
    revenue: real(),
    tagline: text({ length: 30 }),
    imageCover: text("image_cover", { length: 100 }).notNull(),
    apiId: text("api_id").notNull(),
    collectionId: text("collection_id"),
    directorName: text("director_name", { length: 100 }),
    compositorName: text("compositor_name"),
    lockStatus: numeric("lock_status"),
    lastApiUpdate: numeric("last_api_update"),
});
