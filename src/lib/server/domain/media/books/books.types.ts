import {TopMetricStats} from "@/lib/server/types/base.types";
import {books, booksList} from "@/lib/server/database/schema";
import {booksAchievements} from "@/lib/server/domain/media/books/achievements.seed";


export type Book = typeof books.$inferSelect;
export type BooksList = typeof booksList.$inferSelect;


export type UpsertBooksWithDetails = {
    mediaData: typeof books.$inferInsert,
    genresData?: { name: string }[],
    authorsData?: { name: string }[],
};


export type BooksTopMetricStats = {
    langsStats: TopMetricStats;
    authorsStats: TopMetricStats;
    publishersStats: TopMetricStats;
};


export type BooksAchCodeName = typeof booksAchievements[number]["codeName"];
