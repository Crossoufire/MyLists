import Database from "bun:sqlite";
import {eq} from "drizzle-orm";
import {MediaType} from "@/lib/utils/enums";
import * as schema from "@/lib/server/database/schema";
import {migrate} from "drizzle-orm/bun-sqlite/migrator";
import {drizzle, type BunSQLiteDatabase} from "drizzle-orm/bun-sqlite";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {editMediaDetailsPayloadSchemas} from "@/lib/schemas/media-details.schema";
import {animeServerDefinition} from "@/lib/media-definitions/tv/anime/anime.definition.server";
import {seriesServerDefinition} from "@/lib/media-definitions/tv/series/series.definition.server";


const dbContext = vi.hoisted(() => ({ db: undefined as any }));

vi.mock("@/lib/server/database/db", () => ({
    get db() { return dbContext.db; },
}));
vi.mock("@/lib/utils/image-saver", () => ({ saveImageFromUrl: vi.fn().mockResolvedValue("updated.jpg") }));

const { MoviesRepository, MoviesService } = await import("@/lib/server/domain/media/movies");
const { GamesRepository, GamesService } = await import("@/lib/server/domain/media/games");
const { BooksRepository, BooksService } = await import("@/lib/server/domain/media/books");
const { MangaRepository, MangaService } = await import("@/lib/server/domain/media/manga");
const { TvRepository, TvService } = await import("@/lib/server/domain/media/tv");
const { saveImageFromUrl } = await import("@/lib/utils/image-saver");
const { getServerMediaDefinition } = await import("@/lib/media-definitions/definition.registry.server");

const services = {
    [MediaType.MOVIES]: new MoviesService(new MoviesRepository()),
    [MediaType.GAMES]: new GamesService(new GamesRepository()),
    [MediaType.BOOKS]: new BooksService(new BooksRepository()),
    [MediaType.MANGA]: new MangaService(new MangaRepository()),
    [MediaType.SERIES]: new TvService(new TvRepository(seriesServerDefinition), seriesServerDefinition),
    [MediaType.ANIME]: new TvService(new TvRepository(animeServerDefinition), animeServerDefinition),
};


describe("validated metadata edits", () => {
    let sqlite: Database;
    let db: BunSQLiteDatabase<typeof schema>;

    beforeEach(async () => {
        vi.clearAllMocks();
        sqlite = new Database(":memory:");
        db = drizzle(sqlite, { schema, casing: "snake_case" });
        dbContext.db = db;
        migrate(db, { migrationsFolder: "./drizzle" });
        sqlite.run("PRAGMA foreign_keys = ON");

        const media = { id: 1, apiId: 100, name: "Original", imageCover: "original.jpg" };
        await db.insert(schema.movies).values({ ...media, duration: 120 });
        await db.insert(schema.games).values(media);
        await db.insert(schema.books).values({ ...media, apiId: "book-100", pages: 250 });
        await db.insert(schema.manga).values({ ...media, chapters: 50 });
        await db.insert(schema.series).values({ ...media, duration: 45, totalSeasons: 1, totalEpisodes: 10 });
        await db.insert(schema.anime).values({ ...media, duration: 24, totalSeasons: 1, totalEpisodes: 12 });
    });

    afterEach(() => {
        sqlite.close();
        dbContext.db = undefined;
    });

    it.each(Object.values(MediaType))("updates only submitted fields for %s", async (mediaType) => {
        const specialFields = mediaType === MediaType.BOOKS ? ["authors"] : mediaType === MediaType.MANGA ? ["genres"] : [];
        const expectedFields = [...getServerMediaDefinition(mediaType).service.editableFields, "imageCover", ...specialFields];
        expect(Object.keys(editMediaDetailsPayloadSchemas[mediaType].shape).sort()).toEqual(expectedFields.sort());

        const service = services[mediaType];
        const before = service.findById(1)!;
        const payload = Object.freeze(editMediaDetailsPayloadSchemas[mediaType].parse({ name: "Updated", lockStatus: "false" }));

        await service.updateMediaEditableFields(1, payload);

        expect(service.findById(1)).toEqual({ ...before, name: "Updated", lockStatus: false, lastApiUpdate: expect.any(String) });
        expect(saveImageFromUrl).not.toHaveBeenCalled();
    });

    it("stores normalized numbers and downloaded cover filenames without changing the payload", async () => {
        const payload = Object.freeze(editMediaDetailsPayloadSchemas[MediaType.MOVIES].parse({
            duration: "95", imageCover: "https://example.com/new.jpg",
        }));
        await services[MediaType.MOVIES].updateMediaEditableFields(1, payload);

        expect(services[MediaType.MOVIES].findById(1)).toMatchObject({ duration: 95, imageCover: expect.stringContaining("updated.jpg") });
        expect(saveImageFromUrl).toHaveBeenCalledWith({ dirSaveName: "movies-covers", imageUrl: "https://example.com/new.jpg" });
        expect(payload.imageCover).toBe("https://example.com/new.jpg");
    });

    it("preserves omitted book authors and replaces or clears explicit authors", async () => {
        await db.insert(schema.booksAuthors).values({ mediaId: 1, name: "Original author" });
        const service = services[MediaType.BOOKS];
        await service.updateMediaEditableFields(1, { pages: 300 });
        expect(db.select().from(schema.booksAuthors).all()).toMatchObject([{ name: "Original author" }]);

        await service.updateMediaEditableFields(1, { authors: " Author A,Author A,Author B " });
        expect(db.select({ name: schema.booksAuthors.name }).from(schema.booksAuthors).all()).toEqual([{ name: "Author A" }, { name: "Author B" }]);

        await service.updateMediaEditableFields(1, { authors: "" });
        expect(db.select().from(schema.booksAuthors).all()).toEqual([]);
        expect(service.findById(1)?.pages).toBe(300);
    });

    it("preserves omitted manga genres and deduplicates or clears explicit genres", async () => {
        await db.insert(schema.mangaGenre).values({ mediaId: 1, name: "Original genre" });
        const service = services[MediaType.MANGA];
        await service.updateMediaEditableFields(1, { chapters: 100 });
        expect(db.select().from(schema.mangaGenre).all()).toMatchObject([{ name: "Original genre" }]);

        const payload = editMediaDetailsPayloadSchemas[MediaType.MANGA].parse({ genres: ["Drama", { name: "Drama" }, "Action"] });
        await service.updateMediaEditableFields(1, payload);
        expect(db.select({ name: schema.mangaGenre.name }).from(schema.mangaGenre).where(eq(schema.mangaGenre.mediaId, 1)).orderBy(schema.mangaGenre.name).all())
            .toEqual([{ name: "Action" }, { name: "Drama" }]);

        await service.updateMediaEditableFields(1, { genres: [] });
        expect(db.select().from(schema.mangaGenre).all()).toEqual([]);
        expect(service.findById(1)?.chapters).toBe(100);
    });
});
