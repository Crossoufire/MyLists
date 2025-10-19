import pino from "pino";
import path from "path";
import * as fs from "fs";
import Papa from "papaparse";
import {serverEnv} from "@/env/server";
import {MediaType} from "@/lib/utils/enums";
import {readFile, unlink} from "fs/promises";
import {llmResponseSchema} from "@/lib/types/zod.schema.types";
import {getDbClient, withTransaction} from "@/lib/server/database/async-storage";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {BaseJobData, CsvJobData, TaskJobData, TasksName} from "@/lib/types/tasks.types";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {NotificationsService} from "@/lib/server/domain/user/services/notifications.service";
import {MediaProviderServiceRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


type ProgressCallback = (progress: number | object) => Promise<void>;
type TaskHandler = (data: TaskJobData, onProgress?: ProgressCallback) => Promise<void>;


export class TasksService {
    private logger: pino.Logger;
    private mediaTypes: MediaType[];
    private readonly taskHandlers: Record<TasksName, TaskHandler>;

    constructor(
        logger: pino.Logger,
        private userRepository: typeof UserRepository,
        private mediaServiceRegistry: typeof MediaServiceRegistry,
        private mediaProviderRegistry: typeof MediaProviderServiceRegistry,
        private achievementsService: AchievementsService,
        private userUpdatesService: UserUpdatesService,
        private notificationsService: NotificationsService,
        private userStatsService: UserStatsService,
    ) {
        this.mediaTypes = Object.values(MediaType);
        this.logger = logger.child({ service: "TasksService" });

        this.taskHandlers = {
            vacuumDb: this.runVacuumDB.bind(this),
            analyzeDb: this.runAnalyzeDB.bind(this),
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

    async runTask(taskName: TasksName, data: TaskJobData, onProgress?: ProgressCallback) {
        const taskLogger = this.logger.child({ taskName, triggeredBy: data.triggeredBy });
        taskLogger.info({ data }, "Received the request to run this task");

        const startTime = Date.now();

        const taskHandler = this.taskHandlers[taskName];
        if (!taskHandler) {
            taskLogger.error(`Unknown task name: ${taskName}`);
            throw new Error(`Unknown task name: ${taskName}`);
        }

        try {
            await taskHandler(data, onProgress);
        }
        catch (err: any) {
            taskLogger.error({ err }, "Task execution failed");
            throw err;
        }

        const duration = (Date.now() - startTime);
        taskLogger.info({ durationMs: duration }, "Task completed");
    }

    protected async runBulkMediaRefresh(_data: BaseJobData) {
        this.logger.info("Starting: bulkMediaRefresh execution.");

        for (const mediaType of this.mediaTypes) {
            this.logger.info({ mediaType }, `Refreshing media for ${mediaType}...`);

            const mediaProviderService = this.mediaProviderRegistry.getService(mediaType);
            for await (const result of mediaProviderService.bulkProcessAndRefreshMedia()) {
                if (result.state === "fulfilled") {
                    this.logger.info(`Refreshed ${mediaType} with apiId: ${result.apiId}`);
                }
                else {
                    this.logger.error(
                        { err: result.reason?.message ?? result.reason, apiId: result.apiId },
                        `Error refreshing ${mediaType} with apiId: ${result.apiId}`
                    );
                }
            }

            this.logger.info({ mediaType }, `Refreshing ${mediaType} completed.`);
        }

        this.logger.info("Completed: bulkMediaRefresh execution.");
    }

    protected async runVacuumDB(_data: BaseJobData) {
        this.logger.info("Starting: VacuumDB execution.");
        getDbClient().run("VACUUM");
        this.logger.info("Completed: VacuumDB execution.");
    }

    protected async runAnalyzeDB(_data: BaseJobData) {
        this.logger.info("Starting: AnalyzeDB execution.");
        getDbClient().run("ANALYZE");
        this.logger.info("Completed: AnalyzeDB execution.");
    }

    protected async runRemoveUnusedMediaCovers(_data: BaseJobData) {
        this.logger.info("Starting: RemoveUnusedMediaCovers execution.");

        const baseUploadsLocation = serverEnv.BASE_UPLOADS_LOCATION;
        for (const mediaType of this.mediaTypes) {
            this.logger.info(`Starting cleanup for '${mediaType}' covers...`);

            const coversDirectoryPath = path.isAbsolute(baseUploadsLocation) ?
                path.join(baseUploadsLocation, `${mediaType}-covers`) :
                path.join(process.cwd(), baseUploadsLocation, `${mediaType}-covers`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const dbCoverFilenames = await mediaService.getCoverFilenames();
            const dbCoverSet = new Set(dbCoverFilenames);

            const filesOnDisk = await fs.promises.readdir(coversDirectoryPath);
            this.logger.info(`Found ${filesOnDisk.length} files in directory`);

            const coversToDelete = filesOnDisk.filter((filename) => !dbCoverSet.has(filename) && filename !== "default.jpg");
            if (coversToDelete.length === 0) {
                this.logger.info(`No old '${mediaType}' covers to remove.`);
                continue;
            }

            let failedCount = 0;
            let deletionCount = 0;
            this.logger.info(`${coversToDelete.length} '${mediaType}' covers to remove...`);

            for (const cover of coversToDelete) {
                const filePath = path.join(coversDirectoryPath, cover);
                try {
                    await fs.promises.unlink(filePath);
                    this.logger.info(`Deleted: ${cover}`);
                    deletionCount += 1;
                }
                catch (error) {
                    console.warn(`Failed to delete ${cover}:`, error);
                    failedCount += 1;
                }
            }

            if (deletionCount > 0) {
                this.logger.info(`Successfully deleted ${deletionCount} old '${mediaType}' covers.`);
            }
            if (failedCount > 0) {
                this.logger.warn(`Failed to delete ${failedCount} '${mediaType}' covers.`);
            }
            this.logger.info(`Cleanup finished for '${mediaType}' covers.`);
        }

        this.logger.info("Completed: RemoveUnusedMediaCovers execution.");
    }

    protected async runLockOldMovies(_data: BaseJobData) {
        this.logger.info(`Starting locking movies older than 6 months...`);

        const moviesService = this.mediaServiceRegistry.getService(MediaType.MOVIES);
        const totalMoviesLocked = await moviesService.lockOldMovies();

        this.logger.info({ totalMoviesLocked }, `Locked ${totalMoviesLocked} movies older than 6 months.`);
        this.logger.info("Completed: LockOldMovies execution.");
    }

    protected async runSeedAchievements(_data: BaseJobData) {
        this.logger.info("Starting seeding achievements...");

        for (const mediaType of this.mediaTypes) {
            this.logger.info(`Seeding ${mediaType} achievements...`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const achievementsDefinition = mediaService.getAchievementsDefinition();
            await this.achievementsService.seedAchievements(achievementsDefinition);

            this.logger.info(`Seeding ${mediaType} achievements completed.`);
        }

        this.logger.info("Completed: SeedAchievements execution.");
    }

    protected async runCalculateAchievements(_data: BaseJobData) {
        this.logger.info("Starting calculating all achievements...");

        const allAchievements = await this.achievementsService.allUsersAchievements();
        for (const mediaType of this.mediaTypes) {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const mediaAchievements = allAchievements.filter((achievement) => achievement.mediaType === mediaType);
            for (const achievement of mediaAchievements) {
                await this.achievementsService.calculateAchievement(achievement, mediaService);
            }
            this.logger.info(`Calculating ${mediaType} achievements completed.`);
        }

        this.logger.info("Completed: CalculateAchievements execution.");
    }

    protected async runRemoveNonListMedia(_data: BaseJobData) {
        this.logger.info(`Removing non-list media...`);

        for (const mediaType of this.mediaTypes) {
            this.logger.info(`Removing ${mediaType} non-list media...`);

            await withTransaction(async (_tx) => {
                const mediaService = this.mediaServiceRegistry.getService(mediaType);
                const mediaIds = await mediaService.getNonListMediaIds();
                this.logger.info(`Found ${mediaIds.length} non-list ${mediaType} to remove.`);

                // Remove in other services
                this.userUpdatesService.deleteMediaUpdates(mediaType, mediaIds);
                this.notificationsService.deleteNotifications(mediaType, mediaIds);

                // Remove main media and associated tables: actors, genres, companies, authors...
                await mediaService.removeMediaByIds(mediaIds);
            });

            this.logger.info(`Removing non-list ${mediaType} completed.`);
        }

        this.logger.info("Completed: RemoveNonListMedia execution.");
    }

    protected async runAddMediaNotifications(_data: BaseJobData) {
        this.logger.info("Starting: AddMediaNotifications execution.");

        const mediaTypes = [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES];
        for (const mediaType of mediaTypes) {
            this.logger.info(`Adding ${mediaType} notifications to users...`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const allMediaToNotify = await mediaService.getUpcomingMedia(undefined, true);
            await this.notificationsService.sendMediaNotifications(mediaType, allMediaToNotify);

            this.logger.info(`Adding ${mediaType} notifications completed.`);
        }

        this.logger.info("Completed: AddMediaNotifications execution.");
    }

    protected async runComputeAllUsersStats(_data: BaseJobData) {
        this.logger.info("Starting: ComputeAllUsersStats execution.");

        for (const mediaType of this.mediaTypes) {
            this.logger.info(`Computing ${mediaType} stats for all users...`);

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const userMediaStats = await mediaService.computeAllUsersStats();
            await this.userStatsService.updateAllUsersPreComputedStats(mediaType, userMediaStats);

            this.logger.info(`Computed ${mediaType} stats for all users.`);
        }

        this.logger.info("Completed: ComputeAllUsersStats execution.");
    }

    protected async runUpdateIgdbToken(_data: BaseJobData) {
        this.logger.info("Starting: UpdateIgdbToken execution.");

        const gamesProviderService = this.mediaProviderRegistry.getService(MediaType.GAMES);
        const accessToken = await gamesProviderService.fetchNewIgdbToken();
        if (!accessToken) throw new Error("Failed to fetch new IGDB token.");

        await this._updateEnvFile("IGDB_API_KEY", accessToken);

        this.logger.info("IGDB token updated successfully.");
        this.logger.info("Completed: UpdateIgdbToken execution.");
    }

    protected async runDeleteNonActivatedUsers(_data: BaseJobData) {
        this.logger.info("Starting: DeleteNonActivatedUsers execution.");

        const deletedCount = await this.userRepository.deleteNonActivatedOldUsers();

        this.logger.info({ deletedCount }, `Deleted ${deletedCount} non-activated users older than a week.`);
        this.logger.info("Completed: DeleteNonActivatedUsers execution.");
    }

    protected async runMaintenanceTasks(data: BaseJobData) {
        this.logger.info("Starting: MaintenanceTasks execution.");

        await this.runDeleteNonActivatedUsers(data);
        await this.runRemoveNonListMedia(data);
        await this.runRemoveUnusedMediaCovers(data);
        await this.runBulkMediaRefresh(data);
        await this.runAddMediaNotifications(data);
        await this.runLockOldMovies(data);
        await this.runComputeAllUsersStats(data);
        await this.runCalculateAchievements(data);
        await this.runVacuumDB(data);
        await this.runAnalyzeDB(data);

        this.logger.info("Completed: MaintenanceTasks execution.");
    }

    protected async runAddGenresToBooksUsingLlm(_data: BaseJobData) {
        this.logger.info("Starting: AddGenresToBooksUsingLLM execution.");
        this.logger.info(`Using: ${serverEnv.LLM_MODEL_ID}, from: ${serverEnv.LLM_BASE_URL}`);

        const booksService = this.mediaServiceRegistry.getService(MediaType.BOOKS);
        const booksProvider = this.mediaProviderRegistry.getService(MediaType.BOOKS);

        const booksGenres = booksService.getAvailableGenres().map((g) => g.name);
        const batchedBooks = await booksService.batchBooksWithoutGenres(5);
        this.logger.info(`${batchedBooks.length} batches of books to treat.`);

        const mainPrompt = `
Add genres to the following books. 
For each book, choose the top genres for this book (MAX 4) from this list: 
${booksGenres.join(", ")}.
`;

        for (const booksBatch of batchedBooks.slice(0, 1)) {
            const promptToSend = `${mainPrompt}\n${booksBatch.join("\n")}`;

            try {
                const data = await booksProvider.llmResponse(promptToSend, llmResponseSchema);
                const result = llmResponseSchema.parse(JSON.parse(data.choices[0].message.content ?? ""));

                for (const item of result) {
                    const validGenres = item.genres.filter((g) => booksGenres.includes(g)).slice(0, 4);
                    if (!item.bookApiId || validGenres.length === 0) {
                        this.logger.warn(`Skipping invalid/empty-bookApiId/genres: ${JSON.stringify(item)}`);
                        continue;
                    }

                    await booksService.addGenresToBook(item.bookApiId, validGenres);
                    this.logger.info(`Genres to Book apiID: ${item.bookApiId} added: ${validGenres.join(", ")}`);
                }
            }
            catch (err: any) {
                this.logger.error({ err }, "Error while applying genres");
            }
        }
    }

    protected async runProcessCsv(data: TaskJobData, onProgress?: ProgressCallback) {
        const { userId, filePath } = data as CsvJobData;
        this.logger.info({ userId, filePath }, "Starting CSV processing...");

        try {
            const fileContent = await readFile(filePath, "utf-8");
            const records = Papa.parse<{ title: string, year: number }>(fileContent, { header: true }).data;

            const totalRows = records.length;
            this.logger.info(`Found ${totalRows} rows to process.`);
            if (onProgress) {
                await onProgress({ current: 0, total: totalRows, message: `Found ${totalRows} rows.` });
            }

            for (let i = 0; i < totalRows; i++) {
                const record = records[i];
                const currentRow = i + 1;

                if (!record.title || !record.year) {
                    this.logger.warn({ row: currentRow, record }, "Skipping invalid row: 'title' and 'year' required.");
                    continue;
                }
                const year = Number(record.year);
                if (isNaN(year)) {
                    this.logger.warn({ row: currentRow, record }, "Skipping invalid row: 'year' is not a valid number.");
                    continue;
                }

                this.logger.info(`Processing row ${currentRow}/${totalRows}: ${record.title} (${record.year})`);
                if (onProgress) {
                    await onProgress({ current: currentRow, total: totalRows, message: `Processing: ${record.title}` });
                }

                // 5. HERE IS YOUR BUSINESS LOGIC
                // This is where you would find the movie and add it to the user's list.
                // For example:
                // const movie = await this.mediaServiceRegistry.get(MediaType.MOVIE).findMediaByTitleAndYear(record.title, year);
                // if (movie) {
                //     await this.userUpdatesService.addMediaToList(userId, movie.id);
                //     csvLogger.info(`Added '${movie.title}' to user ${userId}'s list.`);
                // } else {
                //     csvLogger.warn(`Movie not found: ${record.title} (${record.year})`);
                // }

                // Simulate work
                await new Promise((resolve) => setTimeout(resolve, 50));
            }

            this.logger.info("CSV processing completed successfully.");
        }
        finally {
            try {
                await unlink(filePath);
                this.logger.info(`Successfully deleted temporary file: ${filePath}`);
            }
            catch (err) {
                this.logger.error({ err }, `Failed to delete temporary file: ${filePath}`);
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
            throw new Error(`Key ${key} not found in .env file.`);
        }

        await fs.promises.writeFile(envPath, lines.join("\n"));
    }
}
