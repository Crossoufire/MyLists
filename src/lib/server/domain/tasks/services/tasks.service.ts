import path from "path";
import * as fs from "fs";
import Papa from "papaparse";
import {serverEnv} from "@/env/server";
import {readFile, unlink} from "fs/promises";
import {and, eq, inArray, sql} from "drizzle-orm";
import {MediaType, Status} from "@/lib/utils/enums";
import {sqliteTable, text} from "drizzle-orm/sqlite-core";
import {movies, moviesList} from "@/lib/server/database/schema";
import {llmResponseSchema} from "@/lib/types/zod.schema.types";
import {Movie} from "@/lib/server/domain/media/movies/movies.types";
import {UserRepository} from "@/lib/server/domain/user/repositories";
import {TaskContext, TaskHandler, TaskName} from "@/lib/types/tasks.types";
import {getDbClient, withTransaction} from "@/lib/server/database/async-storage";
import {MediaProviderServiceRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";
import {AchievementsService, NotificationsService, UserStatsService, UserUpdatesService,} from "@/lib/server/domain/user/services";


export class TasksService {
    private mediaTypes: MediaType[];
    private readonly taskHandlers: Record<TaskName, TaskHandler>;

    constructor(
        private userRepository: typeof UserRepository,
        private mediaServiceRegistry: typeof MediaServiceRegistry,
        private mediaProviderRegistry: typeof MediaProviderServiceRegistry,
        private achievementsService: AchievementsService,
        private userUpdatesService: UserUpdatesService,
        private notificationsService: NotificationsService,
        private userStatsService: UserStatsService,
    ) {
        this.mediaTypes = Object.values(MediaType);
        this.taskHandlers = {
            dbMaintenance: this.runDbMaintenance.bind(this),
            lockOldMovies: this.runLockOldMovies.bind(this),
            updateIgdbToken: this.runUpdateIgdbToken.bind(this),
            bulkMediaRefresh: this.runBulkMediaRefresh.bind(this),
            seedAchievements: this.runSeedAchievements.bind(this),
            maintenanceTasks: this.runMaintenanceTasks.bind(this),
            removeNonListMedia: this.runRemoveNonListMedia.bind(this),
            computeAllUsersStats: this.runComputeAllUsersStats.bind(this),
            calculateAchievements: this.runCalculateAchievements.bind(this),
            addMediaNotifications: this.runAddMediaNotifications.bind(this),
            removeUnusedMediaCovers: this.runRemoveUnusedMediaCovers.bind(this),
            deleteNonActivatedUsers: this.runDeleteNonActivatedUsers.bind(this),
            addGenresToBooksUsingLlm: this.runAddGenresToBooksUsingLlm.bind(this),
            processCsv: this.runProcessCsv.bind(this),
        };
    }

    async runTask(ctx: TaskContext) {
        const taskLogger = ctx.logger.child({ service: "TasksService", taskName: ctx.data.taskName, triggeredBy: ctx.data.triggeredBy });
        taskLogger.info({ data: ctx.data }, "Received the request to run this task");

        const startTime = Date.now();

        const taskHandler = this.taskHandlers[ctx.data.taskName];
        if (!taskHandler) {
            taskLogger.error(`Unknown task name: ${ctx.data.taskName}`);
            throw new Error(`Unknown task name: ${ctx.data.taskName}`);
        }

        await taskHandler(ctx);

        const duration = (Date.now() - startTime);
        taskLogger.info({ durationMs: duration }, "Task completed");
    }

    protected async runBulkMediaRefresh(ctx: TaskContext) {
        ctx.logger.info("Starting: bulkMediaRefresh execution.");

        for (const mediaType of this.mediaTypes) {
            ctx.logger.info({ mediaType }, `Refreshing media for ${mediaType}...`);

            const mediaProviderService = this.mediaProviderRegistry.getService(mediaType);

            let processedCount = 0;
            const startTime = Date.now();

            for await (const result of mediaProviderService.bulkProcessAndRefreshMedia()) {
                processedCount += 1;

                if (result.state === "fulfilled") {
                    ctx.logger.info(`Refreshed ${mediaType} with apiId: ${result.apiId}`);
                }
                else {
                    ctx.logger.error(
                        { err: result.reason?.message ?? result.reason, apiId: result.apiId },
                        `Error refreshing ${mediaType} with apiId: ${result.apiId}`
                    );
                }
            }

            const endTime = Date.now();
            const durationSecs = (endTime - startTime) / 1000;
            const rps = durationSecs > 0 ? processedCount / durationSecs : 0;

            ctx.logger.info(
                {
                    mediaType,
                    processedCount,
                    requestsPerSecond: rps.toFixed(2),
                    durationSeconds: durationSecs.toFixed(2),
                },
                `Refreshing ${mediaType} completed.`
            );
        }

        ctx.logger.info("Completed: bulkMediaRefresh execution.");
    }

    protected async runDbMaintenance(ctx: TaskContext) {
        ctx.logger.info("Starting: dbMaintenance execution.");
        await getDbClient().run("PRAGMA checkpoint(FULL)");
        await getDbClient().run("VACUUM");
        await getDbClient().run("ANALYZE");
        ctx.logger.info("Completed: dbMaintenance execution.");
    }

    protected async runRemoveUnusedMediaCovers(ctx: TaskContext) {
        ctx.logger.info("Starting: RemoveUnusedMediaCovers execution.");

        const baseUploadsLocation = serverEnv.BASE_UPLOADS_LOCATION;
        for (const mediaType of this.mediaTypes) {
            ctx.logger.info(`Starting cleanup for '${mediaType}' covers...`);

            const coversDirectoryPath = path.isAbsolute(baseUploadsLocation) ?
                path.join(baseUploadsLocation, `${mediaType}-covers`) :
                path.join(process.cwd(), baseUploadsLocation, `${mediaType}-covers`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const dbCoverFilenames = await mediaService.getCoverFilenames();
            const dbCoverSet = new Set(dbCoverFilenames);

            const filesOnDisk = await fs.promises.readdir(coversDirectoryPath);
            ctx.logger.info(`Found ${filesOnDisk.length} files in directory`);

            const coversToDelete = filesOnDisk.filter((filename) => !dbCoverSet.has(filename) && filename !== "default.jpg");
            if (coversToDelete.length === 0) {
                ctx.logger.info(`No old '${mediaType}' covers to remove.`);
                continue;
            }

            let failedCount = 0;
            let deletionCount = 0;
            ctx.logger.info(`${coversToDelete.length} '${mediaType}' covers to remove...`);

            for (const cover of coversToDelete) {
                const filePath = path.join(coversDirectoryPath, cover);
                try {
                    await fs.promises.unlink(filePath);
                    ctx.logger.info(`Deleted: ${cover}`);
                    deletionCount += 1;
                }
                catch (err) {
                    failedCount += 1;
                    ctx.logger.warn({ err }, `Failed to delete ${cover}`);
                }
            }

            if (deletionCount > 0) {
                ctx.logger.info(`Successfully deleted ${deletionCount} old '${mediaType}' covers.`);
            }
            if (failedCount > 0) {
                ctx.logger.warn(`Failed to delete ${failedCount} '${mediaType}' covers.`);
            }
            ctx.logger.info(`Cleanup finished for '${mediaType}' covers.`);
        }

        ctx.logger.info("Completed: RemoveUnusedMediaCovers execution.");
    }

    protected async runLockOldMovies(ctx: TaskContext) {
        ctx.logger.info(`Starting locking movies older than 6 months...`);

        const moviesService = this.mediaServiceRegistry.getService(MediaType.MOVIES);
        const totalMoviesLocked = await moviesService.lockOldMovies();

        ctx.logger.info({ totalMoviesLocked }, `Locked ${totalMoviesLocked} movies older than 6 months.`);
        ctx.logger.info("Completed: LockOldMovies execution.");
    }

    protected async runSeedAchievements(ctx: TaskContext) {
        ctx.logger.info("Starting seeding achievements...");

        for (const mediaType of this.mediaTypes) {
            ctx.logger.info(`Seeding ${mediaType} achievements...`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const achievementsDefinition = mediaService.getAchievementsDefinition();
            await this.achievementsService.seedAchievements(achievementsDefinition);

            ctx.logger.info(`Seeding ${mediaType} achievements completed.`);
        }

        ctx.logger.info("Completed: SeedAchievements execution.");
    }

    protected async runCalculateAchievements(ctx: TaskContext) {
        ctx.logger.info("Starting calculating all achievements...");

        const allAchievements = await this.achievementsService.allUsersAchievements();
        for (const mediaType of this.mediaTypes) {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const mediaAchievements = allAchievements.filter((achievement) => achievement.mediaType === mediaType);
            for (const achievement of mediaAchievements) {
                await this.achievementsService.calculateAchievement(achievement, mediaService);
            }
            ctx.logger.info(`Calculating ${mediaType} achievements completed.`);
        }

        ctx.logger.info("Completed: CalculateAchievements execution.");
    }

    protected async runRemoveNonListMedia(ctx: TaskContext) {
        ctx.logger.info(`Removing non-list media...`);

        for (const mediaType of this.mediaTypes) {
            ctx.logger.info(`Removing ${mediaType} non-list media...`);

            await withTransaction(async (_tx) => {
                const mediaService = this.mediaServiceRegistry.getService(mediaType);
                const mediaIds = await mediaService.getNonListMediaIds();
                ctx.logger.info(`Found ${mediaIds.length} non-list ${mediaType} to remove.`);

                // Remove in other services
                await this.userUpdatesService.deleteMediaUpdates(mediaType, mediaIds);
                await this.notificationsService.deleteNotifications(mediaType, mediaIds);

                // Remove main media and associated tables: actors, genres, companies, authors...
                await mediaService.removeMediaByIds(mediaIds);
            });

            ctx.logger.info(`Removing non-list ${mediaType} completed.`);
        }

        ctx.logger.info("Completed: RemoveNonListMedia execution.");
    }

    protected async runAddMediaNotifications(ctx: TaskContext) {
        ctx.logger.info("Starting: AddMediaNotifications execution.");

        const mediaTypes = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES];
        for (const mediaType of mediaTypes) {
            ctx.logger.info(`Adding ${mediaType} notifications to users...`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const allMediaToNotify = await mediaService.getUpcomingMedia(undefined, true);
            await this.notificationsService.sendMediaNotifications(mediaType, allMediaToNotify);

            ctx.logger.info(`Adding ${mediaType} notifications completed.`);
        }

        ctx.logger.info("Completed: AddMediaNotifications execution.");
    }

    protected async runComputeAllUsersStats(ctx: TaskContext) {
        ctx.logger.info("Starting: ComputeAllUsersStats execution.");

        for (const mediaType of this.mediaTypes) {
            ctx.logger.info(`Computing ${mediaType} stats for all users...`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const userMediaStats = await mediaService.computeAllUsersStats();
            await this.userStatsService.updateAllUsersPreComputedStats(mediaType, userMediaStats);

            ctx.logger.info(`Computed ${mediaType} stats for all users.`);
        }

        ctx.logger.info("Completed: ComputeAllUsersStats execution.");
    }

    protected async runUpdateIgdbToken(ctx: TaskContext) {
        ctx.logger.info("Starting: UpdateIgdbToken execution.");

        const gamesProviderService = this.mediaProviderRegistry.getService(MediaType.GAMES);
        const accessToken = await gamesProviderService.fetchNewIgdbToken();
        if (!accessToken) {
            throw new Error("Failed to fetch new IGDB token.");
        }

        await this._updateEnvFile("IGDB_API_KEY", accessToken);

        ctx.logger.info("IGDB token updated successfully.");
        ctx.logger.info("Completed: UpdateIgdbToken execution.");
    }

    protected async runDeleteNonActivatedUsers(ctx: TaskContext) {
        ctx.logger.info("Starting: DeleteNonActivatedUsers execution.");

        const deletedCount = await this.userRepository.deleteNonActivatedOldUsers();

        ctx.logger.info({ deletedCount }, `Deleted ${deletedCount} non-activated users older than a week.`);
        ctx.logger.info("Completed: DeleteNonActivatedUsers execution.");
    }

    protected async runMaintenanceTasks(ctx: TaskContext) {
        ctx.logger.info("Starting: MaintenanceTasks execution.");

        await this.runDeleteNonActivatedUsers(ctx);
        await this.runRemoveNonListMedia(ctx);
        await this.runRemoveUnusedMediaCovers(ctx);
        await this.runBulkMediaRefresh(ctx);
        await this.runAddMediaNotifications(ctx);
        await this.runLockOldMovies(ctx);
        await this.runComputeAllUsersStats(ctx);
        await this.runCalculateAchievements(ctx);
        await this.runDbMaintenance(ctx);

        ctx.logger.info("Completed: MaintenanceTasks execution.");
    }

    protected async runAddGenresToBooksUsingLlm(ctx: TaskContext) {
        ctx.logger.info("Starting: AddGenresToBooksUsingLLM execution.");
        ctx.logger.info(`Using: ${serverEnv.LLM_MODEL_ID}, from: ${serverEnv.LLM_BASE_URL}`);

        const booksService = this.mediaServiceRegistry.getService(MediaType.BOOKS);
        const booksProvider = this.mediaProviderRegistry.getService(MediaType.BOOKS);

        const booksGenres = booksService.getAvailableGenres();
        const batchedBooks = await booksService.batchBooksWithoutGenres(5);
        ctx.logger.info(`${batchedBooks.length} batches of books to treat.`);

        const mainPrompt = `
Add genres to the following books. 
For each book, choose the top genres for this book (MAX 4) from this list: 
${booksGenres.join(", ")}.
`;

        for (const booksBatch of batchedBooks) {
            const promptToSend = `${mainPrompt}\n${booksBatch.join("\n")}`;

            try {
                const data = await booksProvider.llmResponse(promptToSend, llmResponseSchema);
                const result = llmResponseSchema.parse(JSON.parse(data.choices[0].message.content ?? ""));

                for (const item of result) {
                    const validGenres = item.genres.filter((g) => booksGenres.includes(g)).slice(0, 4);

                    if (!item.bookApiId || validGenres.length === 0) {
                        ctx.logger.warn(`Skipping invalid/empty-bookApiId/genres: ${JSON.stringify(item)}`);
                        continue;
                    }

                    await booksService.addGenresToBook(item.bookApiId, validGenres);
                    ctx.logger.info(`Genres to Book apiID: ${item.bookApiId} added: ${validGenres.join(", ")}`);
                }
            }
            catch (err: any) {
                ctx.logger.error({ err }, "Error while applying genres");
            }
        }
    }

    protected async runProcessCsv(ctx: TaskContext) {
        const userId = ctx.data.userId!;
        const filePath = ctx.data.filePath!;
        ctx.logger.info({ userId, filePath }, "Starting CSV processing...");

        // Generate unique temp table name
        const tempTableName = `temp_import_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        try {
            // --- PARSE AND VALIDATE CSV ---------------------------------------------------------
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
                const title = record.title ? record.title.trim() : "";
                if (!title || !record.year || isNaN(yearNum)) {
                    result.totalInvalid += 1;
                    result.items.push({
                        status: "invalid",
                        reason: "Row is missing 'title' or has an invalid 'year'.",
                        metadata: { name: record.title ?? "", releaseDate: record.year ?? "" },
                    });
                    continue;
                }
                validRecords.push({
                    title: title,
                    year: yearNum,
                    originalRecord: record,
                });
            }

            if (validRecords.length === 0) {
                ctx.logger.info({ result }, "No valid rows found in CSV to process.");
                return;
            }

            ctx.logger.info(`Found ${validRecords.length} valid rows to process.`);

            // --- CREATE AND POPULATE A TEMPORARY TABLE ------------------------------------------
            ctx.logger.info(`Creating temp table: ${tempTableName}`);

            const tempTable = sqliteTable(tempTableName, { title: text("title").notNull(), year: text("year").notNull() });

            await getDbClient().run(
                sql.raw(`
                    CREATE TEMPORARY TABLE ${tempTableName} (
                        title TEXT NOT NULL,
                        year TEXT NOT NULL
                    )`
                )
            );

            await getDbClient()
                .insert(tempTable)
                .values(validRecords.map((record) => ({
                    title: record.title.toLowerCase(),
                    year: String(record.year),
                })));

            ctx.logger.info(`Populated temp table with ${validRecords.length} rows.`);

            // --- BULK FETCH MOVIES BY JOINING WITH THE TEMP TABLE -------------------------------
            ctx.logger.info("Fetching matching movies via JOIN...");
            const foundMovies = await getDbClient()
                .select({
                    id: movies.id,
                    name: movies.name,
                    releaseDate: movies.releaseDate,
                })
                .from(movies)
                .innerJoin(tempTable, and(
                    eq(sql`lower(${movies.name})`, tempTable.title),
                    eq(sql`strftime('%Y', ${movies.releaseDate})`, tempTable.year)
                ));

            ctx.logger.info(`Found ${foundMovies.length} matching movies in the database.`);

            const foundMoviesMap = new Map<string, Movie>();
            for (const movie of foundMovies) {
                const year = new Date(movie.releaseDate!).getFullYear();
                const key = `${movie.name.toLowerCase()}|${year}`;
                foundMoviesMap.set(key, movie as Movie);
            }

            // --- Categorize Records (Found, Not Found, Already in List) -------------------------
            const notFoundRecords: ValidRecord[] = [];
            const moviesToPotentiallyAdd: Movie[] = [];

            for (const record of validRecords) {
                const key = `${record.title.toLowerCase()}|${record.year}`;
                const foundMovie = foundMoviesMap.get(key);
                if (foundMovie) {
                    moviesToPotentiallyAdd.push(foundMovie);
                }
                else {
                    notFoundRecords.push(record);
                    result.totalNotFound += 1;
                    result.items.push({
                        status: "notFound",
                        metadata: {
                            name: record.title,
                            releaseDate: String(record.year),
                        },
                        reason: "Movie not found in the database.",
                    });
                }
            }

            if (moviesToPotentiallyAdd.length === 0) {
                ctx.logger.info({ result }, "No matching movies found in the database for valid rows.");
                return;
            }

            const potentialMovieIds = moviesToPotentiallyAdd.map((movie) => movie.id);
            const userMovies = await getDbClient()
                .select({ movieId: moviesList.mediaId })
                .from(moviesList)
                .where(and(eq(moviesList.userId, userId), inArray(moviesList.mediaId, potentialMovieIds)));

            const existingMovieIds = new Set(userMovies.map((userMovie) => userMovie.movieId));

            // --- Bulk Insert new movies and update stats ----------------------------------------
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
                    .values(
                        moviesToAdd.map((movie) => ({
                            total: 1,
                            userId: userId,
                            mediaId: movie.id,
                            status: Status.COMPLETED,
                        })),
                    );

                // TODO: Add a optional userId to update whole list of 1 user instead of whole list of all users
                //  because for now it updates the stats of all the user's movies list stats lol
                const userMoviesStats = await this.mediaServiceRegistry.getService(MediaType.MOVIES).computeAllUsersStats();
                await this.userStatsService.updateAllUsersPreComputedStats(MediaType.MOVIES, userMoviesStats);

                result.totalSuccess += moviesToAdd.length;
                moviesToAdd.forEach((movie) => {
                    result.items.push({
                        status: "success",
                        metadata: { name: movie.name, releaseDate: movie.releaseDate ?? "" },
                    });
                });
            }

            // --- FINAL LOGGING AND CLEANUP ------------------------------------------------------
            ctx.logger.info("CSV processing completed.");
            ctx.logger.info({ result }, "CSV processing result added");
        }
        finally {
            try {
                await unlink(filePath);
                ctx.logger.info(`Successfully deleted temp file: ${filePath}`);
            }
            catch (err) {
                ctx.logger.error({ err }, `Failed to delete temp file: ${filePath}`);
            }
        }
    }

    private async _updateEnvFile(key: string, value: string) {
        const envPath = path.resolve(process.cwd(), ".env");

        let envContent = "";
        if (fs.existsSync(envPath)) envContent = await fs.promises.readFile(envPath, "utf8");
        const lines = envContent.split("\n");

        let keyFound = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(`${key}=`)) {
                lines[i] = `${key}=${value}`;
                keyFound = true;
                break;
            }
        }

        if (!keyFound) {
            throw new Error(`Key ${key} not found in '.env' file.`);
        }

        await fs.promises.writeFile(envPath, lines.join("\n"));
    }
}


interface CsvRecord {
    title: string;
    year: string; // Keep as string initially from PapaParse
}


interface ValidRecord {
    title: string;
    year: number;
    // Keep original to report back to user
    originalRecord: CsvRecord;
}


interface ProcessResultItem {
    status: "success" | "skipped" | "notFound" | "invalid";
    reason?: string;
    metadata: {
        name: string;
        releaseDate: string;
    };
}


export interface ProcessResult {
    total: number;
    totalSuccess: number;
    totalSkipped: number;
    totalNotFound: number;
    totalInvalid: number;
    items: ProcessResultItem[];
}
