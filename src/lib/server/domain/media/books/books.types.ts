import {books, booksList} from "@/lib/server/database/schema";
import {AdvancedMediaStats, TopMetricStats} from "@/lib/types/base.types";
import {booksAchievements} from "@/lib/server/domain/media/books/achievements.seed";


export type Book = typeof books.$inferSelect;
export type BooksList = typeof booksList.$inferSelect;
export type BooksAchCodeName = typeof booksAchievements[number]["codeName"];


export type InsertBooksWithDetails = {
    mediaData: typeof books.$inferInsert,
    genresData: { name: string }[],
    authorsData: { name: string }[],
};


export type UpsertBooksWithDetails = {
    mediaData: typeof books.$inferInsert;
    genresData?: { name: string }[],
    authorsData?: { name: string }[],
};


export type UpdateBooksWithDetails = {
    mediaData: Partial<typeof books.$inferInsert> & { apiId: string };
    genresData?: { name: string }[],
    authorsData?: { name: string }[],
};


export type BooksAdvancedStats = AdvancedMediaStats & {
    langsStats: TopMetricStats;
    authorsStats: TopMetricStats;
    publishersStats: TopMetricStats;
}
