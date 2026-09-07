import Database from "bun:sqlite";
import {sql} from "drizzle-orm";
import {MediaType, Status} from "@/lib/utils/enums";
import * as schema from "@/lib/server/database/schema";
import {drizzle, type BunSQLiteDatabase} from "drizzle-orm/bun-sqlite";
import {migrate} from "drizzle-orm/bun-sqlite/migrator";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";


const dbContext = vi.hoisted(() => ({ db: undefined as any }));


vi.mock("@/lib/server/database/async-storage", () => ({
    getDbClient: () => dbContext.db,
}));


const {AdminRepository} = await import("@/lib/server/domain/admin/admin.repository");


describe("AdminRepository", () => {
    let sqlite: Database;
    let db: BunSQLiteDatabase<typeof schema>;

    beforeEach(() => {
        sqlite = new Database(":memory:");
        db = drizzle(sqlite, { schema, casing: "snake_case" });
        dbContext.db = db;
        migrate(db, { migrationsFolder: "./drizzle" });
    });

    afterEach(() => {
        sqlite.close();
        dbContext.db = undefined;
    });

    it("defaults to automatic and persists later overrides", async () => {
        await expect(AdminRepository.getYearRecapReleaseMode(2026)).resolves.toBe("automatic");

        await AdminRepository.updateYearRecapReleaseMode(2026, "enabled");
        await expect(AdminRepository.getYearRecapReleaseMode(2026)).resolves.toBe("enabled");

        await AdminRepository.updateYearRecapReleaseMode(2026, "disabled");
        await expect(AdminRepository.getYearRecapReleaseMode(2026)).resolves.toBe("disabled");
    });

    it("counts monthly additions per entry and updates per distinct media, scoped by media type", async () => {
        await db.insert(schema.user).values([42, 43].map((id) => ({
            id, name: `User ${id}`, email: `${id}@example.com`, emailVerified: true,
            createdAt: "2024-01-01 00:00:00", updatedAt: "2024-01-01 00:00:00",
        })));
        await db.insert(schema.movies).values([100, 101].map((id) => ({
            id, apiId: id, name: `Movie ${id}`, imageCover: "movie.jpg", duration: 120,
        })));
        await db.insert(schema.moviesList).values([
            { userId: 42, mediaId: 100, status: Status.COMPLETED, addedAt: sql`date('now', 'start of month')`, lastUpdated: sql`date('now')` },
            { userId: 43, mediaId: 100, status: Status.COMPLETED, addedAt: sql`date('now', 'start of month')`, lastUpdated: sql`date('now')` },
            { userId: 42, mediaId: 101, status: Status.COMPLETED, addedAt: sql`date('now', 'start of month', '-1 day')`, lastUpdated: sql`date('now')` },
        ]);

        await expect(AdminRepository.getUserMediaAddedAndUpdatedForAdmin(MediaType.MOVIES)).resolves.toEqual({
            added: { thisMonth: 2, lastMonth: 1, comparedToLastMonth: 1 },
            updated: { thisMonth: 2 },
        });
        await expect(AdminRepository.getUserMediaAddedAndUpdatedForAdmin(MediaType.BOOKS)).resolves.toEqual({
            added: { thisMonth: 0, lastMonth: 0, comparedToLastMonth: 0 },
            updated: { thisMonth: 0 },
        });
    });
});
