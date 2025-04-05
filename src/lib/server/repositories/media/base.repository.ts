import {and, eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {anime, animeList, books, booksList, games, gamesList, manga, mangaList, movies, moviesList, series, seriesList} from "@/lib/server/database/schema";


export type MediaTable = typeof series | typeof anime | typeof movies | typeof games | typeof books | typeof manga;


export type MediaListTable = typeof seriesList | typeof animeList | typeof moviesList | typeof gamesList
    | typeof booksList | typeof mangaList;


export abstract class BaseRepository<U extends MediaTable, T extends MediaListTable> {
    protected constructor(protected mediaTable: U, protected listTable: T) {
        this.listTable = listTable;
        this.mediaTable = mediaTable;
    }

    async getUserFavorites(userId: number, limit = 8) {
        return db
            .select({
                mediaId: this.mediaTable.id,
                mediaName: this.mediaTable.name,
                mediaCover: this.mediaTable.imageCover,
            })
            .from(this.listTable)
            .where(and(eq(this.listTable.userId, userId), eq(this.listTable.favorite, true)))
            .leftJoin(this.mediaTable, eq(this.listTable.mediaId, this.mediaTable.id))
            .limit(limit);
    }
}