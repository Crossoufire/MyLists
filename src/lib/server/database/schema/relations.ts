import {user} from "./auth.schema";
import {relations} from "drizzle-orm/relations";
import {
    achievement,
    achievementTier,
    anime,
    animeEpisodesPerSeason,
    animeGenre,
    animeLabels,
    animeList,
    animeNetwork,
    books,
    booksAuthors,
    booksGenre,
    booksLabels,
    booksList,
    dailyMediadle,
    followers,
    games,
    gamesCompanies,
    gamesGenre,
    gamesLabels,
    gamesList,
    gamesPlatforms,
    manga,
    mangaAuthors,
    mangaGenre,
    mangaLabels,
    mangaList,
    mediadleStats,
    movies,
    moviesActors,
    moviesGenre,
    moviesLabels,
    moviesList,
    notifications,
    series,
    seriesEpisodesPerSeason,
    seriesGenre,
    seriesLabels,
    seriesList,
    seriesNetwork,
    userAchievement,
    userMediadleProgress,
    userMediaSettings,
    userMediaUpdate
} from "./schema";


export const followersRelations = relations(followers, ({ one }) => ({
    user_followedId: one(user, {
        fields: [followers.followedId],
        references: [user.id],
        relationName: "followers_followedId_user_id"
    }),
    user_followerId: one(user, {
        fields: [followers.followerId],
        references: [user.id],
        relationName: "followers_followerId_user_id"
    }),
}));

export const userRelations = relations(user, ({ many }) => ({
    followers_followedId: many(followers, {
        relationName: "followers_followedId_user_id"
    }),
    followers_followerId: many(followers, {
        relationName: "followers_followerId_user_id"
    }),
    userMediaUpdates: many(userMediaUpdate),
    seriesLabels: many(seriesLabels),
    animeLabels: many(animeLabels),
    moviesLabels: many(moviesLabels),
    gamesLabels: many(gamesLabels),
    booksLabels: many(booksLabels),
    mangaLabels: many(mangaLabels),
    mangaLists: many(mangaList),
    moviesLists: many(moviesList),
    gamesLists: many(gamesList),
    booksLists: many(booksList),
    animeLists: many(animeList),
    seriesLists: many(seriesList),
    notifications: many(notifications),
    mediadleStats: many(mediadleStats),
    userAchievements: many(userAchievement),
    userMediaSettings: many(userMediaSettings),
    userMediadleProgresses: many(userMediadleProgress),
}));

export const animeEpisodesPerSeasonRelations = relations(animeEpisodesPerSeason, ({ one }) => ({
    anime: one(anime, {
        fields: [animeEpisodesPerSeason.mediaId],
        references: [anime.id]
    }),
}));

export const animeRelations = relations(anime, ({ many }) => ({
    animeEpisodesPerSeasons: many(animeEpisodesPerSeason),
    animeGenres: many(animeGenre),
    animeLabels: many(animeLabels),
    animeNetworks: many(animeNetwork),
    animeLists: many(animeList),
}));

export const seriesEpisodesPerSeasonRelations = relations(seriesEpisodesPerSeason, ({ one }) => ({
    series: one(series, {
        fields: [seriesEpisodesPerSeason.mediaId],
        references: [series.id]
    }),
}));

export const seriesRelations = relations(series, ({ many }) => ({
    seriesEpisodesPerSeasons: many(seriesEpisodesPerSeason),
    seriesGenres: many(seriesGenre),
    seriesLabels: many(seriesLabels),
    seriesNetworks: many(seriesNetwork),
    seriesLists: many(seriesList),
}));

export const gamesPlatformsRelations = relations(gamesPlatforms, ({ one }) => ({
    game: one(games, {
        fields: [gamesPlatforms.mediaId],
        references: [games.id]
    }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
    gamesPlatforms: many(gamesPlatforms),
    gamesCompanies: many(gamesCompanies),
    gamesGenres: many(gamesGenre),
    gamesLabels: many(gamesLabels),
    gamesLists: many(gamesList),
}));

export const gamesCompaniesRelations = relations(gamesCompanies, ({ one }) => ({
    game: one(games, {
        fields: [gamesCompanies.mediaId],
        references: [games.id]
    }),
}));

export const booksAuthorsRelations = relations(booksAuthors, ({ one }) => ({
    book: one(books, {
        fields: [booksAuthors.mediaId],
        references: [books.id]
    }),
}));

export const booksRelations = relations(books, ({ many }) => ({
    booksAuthors: many(booksAuthors),
    booksGenres: many(booksGenre),
    booksLabels: many(booksLabels),
    booksLists: many(booksList),
}));

export const userMediaUpdateRelations = relations(userMediaUpdate, ({ one }) => ({
    user: one(user, {
        fields: [userMediaUpdate.userId],
        references: [user.id]
    }),
}));

export const seriesGenreRelations = relations(seriesGenre, ({ one }) => ({
    series: one(series, {
        fields: [seriesGenre.mediaId],
        references: [series.id]
    }),
}));

export const animeGenreRelations = relations(animeGenre, ({ one }) => ({
    anime: one(anime, {
        fields: [animeGenre.mediaId],
        references: [anime.id]
    }),
}));

export const moviesGenreRelations = relations(moviesGenre, ({ one }) => ({
    movie: one(movies, {
        fields: [moviesGenre.mediaId],
        references: [movies.id]
    }),
}));

export const moviesActorsRelations = relations(moviesActors, ({ one }) => ({
    movie: one(movies, {
        fields: [moviesActors.mediaId],
        references: [movies.id]
    }),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
    moviesGenres: many(moviesGenre),
    moviesLabels: many(moviesLabels),
    moviesLists: many(moviesList),
    moviesActors: many(moviesActors),
}));

export const gamesGenreRelations = relations(gamesGenre, ({ one }) => ({
    game: one(games, {
        fields: [gamesGenre.mediaId],
        references: [games.id]
    }),
}));

export const booksGenreRelations = relations(booksGenre, ({ one }) => ({
    book: one(books, {
        fields: [booksGenre.mediaId],
        references: [books.id]
    }),
}));

export const seriesLabelsRelations = relations(seriesLabels, ({ one }) => ({
    series: one(series, {
        fields: [seriesLabels.mediaId],
        references: [series.id]
    }),
    user: one(user, {
        fields: [seriesLabels.userId],
        references: [user.id]
    }),
}));

export const animeLabelsRelations = relations(animeLabels, ({ one }) => ({
    user: one(user, {
        fields: [animeLabels.userId],
        references: [user.id]
    }),
    anime: one(anime, {
        fields: [animeLabels.mediaId],
        references: [anime.id]
    }),
}));

export const moviesLabelsRelations = relations(moviesLabels, ({ one }) => ({
    user: one(user, {
        fields: [moviesLabels.userId],
        references: [user.id]
    }),
    movie: one(movies, {
        fields: [moviesLabels.mediaId],
        references: [movies.id]
    }),
}));

export const gamesLabelsRelations = relations(gamesLabels, ({ one }) => ({
    game: one(games, {
        fields: [gamesLabels.mediaId],
        references: [games.id]
    }),
    user: one(user, {
        fields: [gamesLabels.userId],
        references: [user.id]
    }),
}));

export const booksLabelsRelations = relations(booksLabels, ({ one }) => ({
    user: one(user, {
        fields: [booksLabels.userId],
        references: [user.id]
    }),
    book: one(books, {
        fields: [booksLabels.mediaId],
        references: [books.id]
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(user, {
        fields: [notifications.userId],
        references: [user.id]
    }),
}));

export const seriesNetworkRelations = relations(seriesNetwork, ({ one }) => ({
    series: one(series, {
        fields: [seriesNetwork.mediaId],
        references: [series.id]
    }),
}));

export const animeNetworkRelations = relations(animeNetwork, ({ one }) => ({
    anime: one(anime, {
        fields: [animeNetwork.mediaId],
        references: [anime.id]
    }),
}));

export const mediadleStatsRelations = relations(mediadleStats, ({ one }) => ({
    user: one(user, {
        fields: [mediadleStats.userId],
        references: [user.id]
    }),
}));

export const achievementTierRelations = relations(achievementTier, ({ one, many }) => ({
    achievement: one(achievement, {
        fields: [achievementTier.achievementId],
        references: [achievement.id]
    }),
    userAchievements: many(userAchievement),
}));

export const achievementRelations = relations(achievement, ({ many }) => ({
    achievementTiers: many(achievementTier),
    userAchievements: many(userAchievement),
}));

export const userMediadleProgressRelations = relations(userMediadleProgress, ({ one }) => ({
    dailyMediadle: one(dailyMediadle, {
        fields: [userMediadleProgress.dailyMediadleId],
        references: [dailyMediadle.id]
    }),
    user: one(user, {
        fields: [userMediadleProgress.userId],
        references: [user.id]
    }),
}));

export const dailyMediadleRelations = relations(dailyMediadle, ({ many }) => ({
    userMediadleProgresses: many(userMediadleProgress),
}));

export const userAchievementRelations = relations(userAchievement, ({ one }) => ({
    achievementTier: one(achievementTier, {
        fields: [userAchievement.tierId],
        references: [achievementTier.id]
    }),
    achievement: one(achievement, {
        fields: [userAchievement.achievementId],
        references: [achievement.id]
    }),
    user: one(user, {
        fields: [userAchievement.userId],
        references: [user.id]
    }),
}));

export const mangaListRelations = relations(mangaList, ({ one }) => ({
    user: one(user, {
        fields: [mangaList.userId],
        references: [user.id]
    }),
    manga: one(manga, {
        fields: [mangaList.mediaId],
        references: [manga.id]
    }),
}));

export const mangaRelations = relations(manga, ({ many }) => ({
    mangaLists: many(mangaList),
    mangaAuthors: many(mangaAuthors),
    mangaGenres: many(mangaGenre),
    mangaLabels: many(mangaLabels),
}));

export const mangaAuthorsRelations = relations(mangaAuthors, ({ one }) => ({
    manga: one(manga, {
        fields: [mangaAuthors.mediaId],
        references: [manga.id]
    }),
}));

export const mangaGenreRelations = relations(mangaGenre, ({ one }) => ({
    manga: one(manga, {
        fields: [mangaGenre.mediaId],
        references: [manga.id]
    }),
}));

export const mangaLabelsRelations = relations(mangaLabels, ({ one }) => ({
    user: one(user, {
        fields: [mangaLabels.userId],
        references: [user.id]
    }),
    manga: one(manga, {
        fields: [mangaLabels.mediaId],
        references: [manga.id]
    }),
}));

export const moviesListRelations = relations(moviesList, ({ one }) => ({
    movie: one(movies, {
        fields: [moviesList.mediaId],
        references: [movies.id]
    }),
    user: one(user, {
        fields: [moviesList.userId],
        references: [user.id]
    }),
}));

export const gamesListRelations = relations(gamesList, ({ one }) => ({
    user: one(user, {
        fields: [gamesList.userId],
        references: [user.id]
    }),
    game: one(games, {
        fields: [gamesList.mediaId],
        references: [games.id]
    }),
}));

export const booksListRelations = relations(booksList, ({ one }) => ({
    user: one(user, {
        fields: [booksList.userId],
        references: [user.id]
    }),
    book: one(books, {
        fields: [booksList.mediaId],
        references: [books.id]
    }),
}));

export const userMediaSettingsRelations = relations(userMediaSettings, ({ one }) => ({
    user: one(user, {
        fields: [userMediaSettings.userId],
        references: [user.id]
    }),
}));

export const animeListRelations = relations(animeList, ({ one }) => ({
    anime: one(anime, {
        fields: [animeList.mediaId],
        references: [anime.id]
    }),
    user: one(user, {
        fields: [animeList.userId],
        references: [user.id]
    }),
}));

export const seriesListRelations = relations(seriesList, ({ one }) => ({
    user: one(user, {
        fields: [seriesList.userId],
        references: [user.id]
    }),
    series: one(series, {
        fields: [seriesList.mediaId],
        references: [series.id]
    }),
}));