import Database from "bun:sqlite";
import {readMigrationFiles} from "drizzle-orm/migrator";
import {describe, expect, it} from "vitest";

const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
const seasonalIndex = migrations.findIndex(m => m.sql.some(s => s.includes("series_season_migration")));

describe("TV season-state migration", () => {
    it("preserves legacy ratings, ordered rewatches and unavailable rewatch data for both TV categories", () => {
        const db = new Database(":memory:");
        try {
            db.transaction(() => {
                for (const migration of migrations.slice(0, seasonalIndex)) {
                    for (const statement of migration.sql) db.exec(statement);
                }
            })();
            db.exec(`INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (1, 'migrating', 'migration@example.com', 1, '2025-01-01', '2025-01-01')`);
            for (const kind of ["series", "anime"]) {
                db.exec(`INSERT INTO ${kind} (id, api_id, name, image_cover, duration, total_seasons, total_episodes) VALUES (1, 1, 'Show', 'show.jpg', 30, 2, 16)`);
                // Array positions historically follow sorted metadata, even for non-consecutive numbers.
                db.exec(`INSERT INTO ${kind}_episodes_per_season (media_id, season, episodes) VALUES (1, 1, 8), (1, 3, 8)`);
                db.exec(`INSERT INTO ${kind}_list (id, user_id, media_id, status, current_season, current_episode, total, redo, rating) VALUES (1, 1, 1, 'Completed', 3, 8, 40, '[1,2]', 8.5)`);
                db.exec(`INSERT INTO ${kind} (id, api_id, name, image_cover, duration, total_seasons, total_episodes) VALUES (2, 2, 'Shrunk show', 'show.jpg', 30, 1, 8)`);
                db.exec(`INSERT INTO ${kind}_episodes_per_season (media_id, season, episodes) VALUES (2, 1, 8)`);
                db.exec(`INSERT INTO ${kind}_list (id, user_id, media_id, status, current_season, current_episode, total, redo, rating) VALUES (2, 1, 2, 'Completed', 1, 8, 8, '[0,2]', 0)`);
            }
            db.exec("PRAGMA foreign_keys=ON");
            db.transaction(() => { for (const statement of migrations[seasonalIndex].sql) db.exec(statement); })();
            for (const kind of ["series", "anime"]) {
                expect(db.query(`SELECT season, redo, rating FROM ${kind}_list_seasons WHERE list_id = 1 ORDER BY season`).all()).toEqual([
                    { season: 1, redo: 1, rating: 8.5 }, { season: 3, redo: 2, rating: 8.5 },
                ]);
                expect(db.query(`SELECT redo, rating, total FROM ${kind}_list WHERE id = 1`).get()).toEqual({ redo: 3, rating: 8.5, total: 40 });
                expect(db.query(`SELECT season, redo, rating FROM ${kind}_list_seasons WHERE list_id = 2 ORDER BY season`).all()).toEqual([
                    { season: 1, redo: 0, rating: 0 }, { season: 2, redo: 2, rating: null },
                ]);
                expect(db.query(`SELECT redo FROM ${kind}_list WHERE id = 2`).get()).toEqual({ redo: 0 });
            }
            expect(db.query("PRAGMA foreign_key_check").all()).toEqual([]);
        }
        finally { db.close(); }
    });
});
