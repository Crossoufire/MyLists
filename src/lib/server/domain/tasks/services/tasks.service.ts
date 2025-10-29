import path from "path";
import * as fs from "fs";
import Papa from "papaparse";
import {serverEnv} from "@/env/server";
import {MediaType} from "@/lib/utils/enums";
import {readFile, unlink} from "fs/promises";
import {FormattedError} from "@/lib/utils/error-classes";
import {llmResponseSchema} from "@/lib/types/zod.schema.types";
import {UserRepository} from "@/lib/server/domain/user/repositories";
import {getDbClient, withTransaction} from "@/lib/server/database/async-storage";
import {CsvJobData, TaskContext, TaskHandler, TaskName} from "@/lib/types/tasks.types";
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
        const taskLogger = ctx.logger.child({ service: "TasksService", taskName: ctx.taskName, triggeredBy: ctx.triggeredBy });
        taskLogger.info({ data: ctx.data }, "Received the request to run this task");

        const startTime = Date.now();

        const taskHandler = this.taskHandlers[ctx.taskName];
        if (!taskHandler) {
            taskLogger.error(`Unknown task name: ${ctx.taskName}`);
            throw new Error(`Unknown task name: ${ctx.taskName}`);
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

                if (ctx.cancelCallback) {
                    await ctx.cancelCallback();
                }

                if (ctx.progressCallback) {
                    await ctx.progressCallback({
                        total: Infinity,
                        current: processedCount,
                        message: `Refreshing ${mediaType} with apiId: ${result.apiId}`,
                    });
                }

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

        let progressCount = 0;
        for (const booksBatch of batchedBooks) {
            progressCount += 1;

            if (ctx.cancelCallback) {
                await ctx.cancelCallback();
            }

            if (ctx.progressCallback) {
                await ctx.progressCallback({
                    current: progressCount,
                    total: batchedBooks.length,
                    message: `Adding genres to books: ${progressCount}/${batchedBooks.length}`,
                });
            }

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
        const { userId, filePath } = ctx.data as CsvJobData;
        ctx.logger.info({ userId, filePath }, "Starting CSV processing...");

        try {
            const fileContent = await readFile(filePath, "utf-8");
            const records = Papa.parse<{ title: string, year: number }>(fileContent, { header: true }).data;

            const totalRows = records.length;
            ctx.logger.info(`Found ${totalRows} rows to process.`);
            if (ctx.progressCallback) {
                await ctx.progressCallback({
                    current: 0,
                    total: totalRows,
                    message: `Found ${totalRows} rows.`,
                });
            }

            const result = {
                total: totalRows,
                totalSuccess: 0,
                totalFailed: 0,
                totalSkipped: 0,
                items: [],
            };

            for (let i = 0; i < totalRows; i++) {
                if (ctx.cancelCallback) {
                    await ctx.cancelCallback();
                }

                const record = records[i];
                const currentRow = i + 1;

                if (!record.title || !record.year) {
                    ctx.logger.warn({ row: currentRow, record }, "Skipping invalid row: 'title' and 'year' required.");
                    continue;
                }
                const year = Number(record.year);
                if (isNaN(year)) {
                    ctx.logger.warn({ row: currentRow, record }, "Skipping invalid row: 'year' is not a valid number.");
                    continue;
                }

                ctx.logger.info(`Processing row ${currentRow}/${totalRows}: ${record.title} (${record.year})`);
                if (ctx.progressCallback) {
                    await ctx.progressCallback({
                        total: totalRows,
                        current: currentRow,
                        message: `Processing: ${record.title}`,
                    });
                }

                const moviesService = this.mediaServiceRegistry.getService(MediaType.MOVIES);
                const metadata = { name: record.title, releaseDate: String(record.year) }
                try {
                    const movie = await moviesService.findByTitleAndYear(record.title, year);
                    if (!movie) {
                        this._logItem({ result, metadata, status: "failed", reason: "Movie not found" });
                        continue;
                    }

                    try {
                        const { delta } = await moviesService.addMediaToUserList(userId, movie.id);
                        await this.userStatsService.updateUserPreComputedStatsWithDelta(MediaType.MOVIES, userId, delta);
                        this._logItem({ result, status: "success", metadata: { name: movie.name, releaseDate: movie.releaseDate } });
                    }
                    catch (err: any) {
                        this._logItem({ result, metadata, status: err instanceof FormattedError ? "skipped" : "failed", reason: err.message });
                    }
                }
                catch (err: any) {
                    this._logItem({ result, metadata, status: "failed", reason: err.message });
                }

                // await new Promise((resolve) => setTimeout(resolve, 3000));
            }

            ctx.logger.info("CSV processing completed successfully.");
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

    private _logItem({ result, status, reason, metadata }: LogItem) {
        if (status === "success") {
            result.totalSuccess += 1;
        }
        else if (status === "failed") {
            result.totalFailed += 1;
        }
        else if (status === "skipped") {
            result.totalSkipped += 1;
        }

        result.items.push({ status, reason, metadata });
    }
}


type LogItem = {
    reason?: string,
    result: CsvResult,
    metadata?: Record<string, string | null>,
    status: "success" | "failed" | "skipped",
};


type CsvResult = {
    total: number,
    totalSuccess: number,
    totalFailed: number,
    totalSkipped: number,
    items: Array<object>,
}