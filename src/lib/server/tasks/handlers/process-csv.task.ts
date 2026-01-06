import {z} from "zod";
import Papa from "papaparse";
import {readFile, unlink} from "fs/promises";
import {and, eq, inArray, sql} from "drizzle-orm";
import {MediaType, Status} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {sqliteTable, text} from "drizzle-orm/sqlite-core";
import {defineTask} from "@/lib/server/tasks/define-task";
import {getDbClient} from "@/lib/server/database/async-storage";
import {movies, moviesList} from "@/lib/server/database/schema";
import {Movie} from "@/lib/server/domain/media/movies/movies.types";


interface CsvRecord {
    title: string;
    year: string;
}


interface ValidRecord {
    title: string;
    year: number;
    originalRecord: CsvRecord;
}


interface ProcessResultItem {
    status: "success" | "skipped" | "notFound" | "invalid";
    reason?: string;
    metadata: { name: string; releaseDate: string };
}


export interface ProcessResult {
    total: number;
    totalSuccess: number;
    totalSkipped: number;
    totalNotFound: number;
    totalInvalid: number;
    items: ProcessResultItem[];
}


// Not implemented yet
export const processCsvTask = defineTask({
    meta: {
        visibility: "user",
        description: "Import movies from a CSV file into user's list",
    },
    inputSchema: z.object({
        filePath: z.string().describe("Path to the CSV file"),
        userId: z.coerce.number().describe("User ID to import movies for"),
    }),
    handler: async (ctx) => {
        const { userId, filePath } = ctx.input;
        const container = await getContainer();
        const mediaRegistry = container.registries.mediaService;
        const userStatsService = container.services.userStats;

        const tempTableName = `temp_import_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        try {
            // --- PARSE AND VALIDATE CSV ---
            const fileContent = await readFile(filePath, "utf-8");
            const parseResult = Papa.parse<CsvRecord>(fileContent, { header: true, skipEmptyLines: true });

            const result: ProcessResult = {
                items: [],
                totalSuccess: 0,
                totalSkipped: 0,
                totalInvalid: 0,
                totalNotFound: 0,
                total: parseResult.data.length,
            };

            const validRecords: ValidRecord[] = [];
            for (const record of parseResult.data) {
                const yearNum = Number(record.year);
                const title = record.title?.trim() ?? "";

                if (!title || !record.year || isNaN(yearNum)) {
                    result.totalInvalid += 1;
                    result.items.push({
                        status: "invalid",
                        reason: "Row is missing 'title' or has an invalid 'year'.",
                        metadata: { name: record.title ?? "", releaseDate: record.year ?? "" },
                    });
                    continue;
                }

                validRecords.push({ title, year: yearNum, originalRecord: record });
            }

            if (validRecords.length === 0) {
                ctx.logger.info({ result }, "No valid rows found in CSV");
                return;
            }

            ctx.logger.info({ count: validRecords.length }, "Valid rows to process");

            // --- CREATE AND POPULATE TEMP TABLE ---
            const tempTable = sqliteTable(tempTableName, {
                title: text("title").notNull(),
                year: text("year").notNull(),
            });

            await getDbClient().run(
                sql.raw(`
                    CREATE TEMPORARY TABLE ${tempTableName} (
                        title TEXT NOT NULL,
                        year TEXT NOT NULL
                    )
                `)
            );

            await getDbClient()
                .insert(tempTable)
                .values(validRecords.map((r) => ({ title: r.title.toLowerCase(), year: String(r.year) })));

            // --- BULK FETCH MOVIES ---
            const foundMovies = await getDbClient()
                .select({ id: movies.id, name: movies.name, releaseDate: movies.releaseDate })
                .from(movies)
                .innerJoin(tempTable, and(
                    eq(sql`lower(${movies.name})`, tempTable.title),
                    eq(sql`strftime('%Y', ${movies.releaseDate})`, tempTable.year)
                ));

            ctx.logger.info({ count: foundMovies.length }, "Matching movies found");

            const foundMoviesMap = new Map<string, Movie>();
            for (const movie of foundMovies) {
                const year = new Date(movie.releaseDate!).getFullYear();
                foundMoviesMap.set(`${movie.name.toLowerCase()}|${year}`, movie as Movie);
            }

            // --- CATEGORIZE RECORDS ---
            const moviesToPotentiallyAdd: Movie[] = [];

            for (const record of validRecords) {
                const key = `${record.title.toLowerCase()}|${record.year}`;
                const foundMovie = foundMoviesMap.get(key);

                if (foundMovie) {
                    moviesToPotentiallyAdd.push(foundMovie);
                }
                else {
                    result.totalNotFound += 1;
                    result.items.push({
                        status: "notFound",
                        reason: "Movie not found in the database.",
                        metadata: { name: record.title, releaseDate: String(record.year) },
                    });
                }
            }

            if (moviesToPotentiallyAdd.length === 0) {
                ctx.logger.info({ result }, "No matching movies found for valid rows");
                return;
            }

            // --- CHECK EXISTING USER MOVIES ---
            const potentialMovieIds = moviesToPotentiallyAdd.map((m) => m.id);
            const userMovies = await getDbClient()
                .select({ movieId: moviesList.mediaId })
                .from(moviesList)
                .where(and(eq(moviesList.userId, userId), inArray(moviesList.mediaId, potentialMovieIds)));

            const existingMovieIds = new Set(userMovies.map((um) => um.movieId));

            // --- BULK INSERT ---
            const moviesToAdd: Movie[] = [];

            for (const movie of moviesToPotentiallyAdd) {
                if (existingMovieIds.has(movie.id)) {
                    result.totalSkipped += 1;
                    result.items.push({
                        status: "skipped",
                        reason: "Movie is already in the user's list.",
                        metadata: { name: movie.name, releaseDate: movie.releaseDate ?? "" },
                    });
                }
                else {
                    moviesToAdd.push(movie);
                }
            }

            if (moviesToAdd.length > 0) {
                await getDbClient()
                    .insert(moviesList)
                    .values(moviesToAdd.map((movie) => ({
                        total: 1,
                        userId,
                        mediaId: movie.id,
                        status: Status.COMPLETED,
                    })));

                const userMoviesStats = await mediaRegistry.getService(MediaType.MOVIES).computeAllUsersStats();
                await userStatsService.updateAllUsersPreComputedStats(MediaType.MOVIES, userMoviesStats);

                result.totalSuccess += moviesToAdd.length;
                moviesToAdd.forEach((movie) => {
                    result.items.push({
                        status: "success",
                        metadata: { name: movie.name, releaseDate: movie.releaseDate ?? "" },
                    });
                });
            }

            ctx.logger.info({ result }, "CSV processing completed");
        }
        finally {
            try {
                await unlink(filePath);
                ctx.logger.info({ filePath }, "Deleted temp file");
            }
            catch (err) {
                ctx.logger.error({ err, filePath }, "Failed to delete temp file");
            }
        }
    },
});
