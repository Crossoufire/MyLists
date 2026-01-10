import {manga, mangaList} from "@/lib/server/database/schema";
import {mangaAchievements} from "@/lib/server/domain/media/manga/achievements.seed";


export type Manga = typeof manga.$inferSelect;


export type MangaList = typeof mangaList.$inferSelect;


export type MangaAchCodeName = typeof mangaAchievements[number]["codeName"];


export type UpsertMangaWithDetails = {
    mediaData: typeof manga.$inferInsert,
    genresData?: { name: string }[],
    authorsData?: { name: string }[],
};
