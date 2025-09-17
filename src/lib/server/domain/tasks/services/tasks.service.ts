import pino from "pino";
import path from "path";
import * as fs from "fs";
import {serverEnv} from "@/env/server";
import {TasksName} from "@/lib/types/base.types";
import {MediaType} from "@/lib/server/utils/enums";
import {getDbClient, withTransaction} from "@/lib/server/database/async-storage";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {NotificationsService} from "@/lib/server/domain/user/services/notifications.service";
import {MediaProviderServiceRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


type TaskHandler = () => Promise<void>;


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
        };
    }

    async runTask(taskName: TasksName) {
        const taskLogger = this.logger.child({ taskName });
        taskLogger.info("Received the request to run this task");

        const startTime = Date.now();

        const taskHandler = this.taskHandlers[taskName];
        if (!taskHandler) {
            taskLogger.error(`Unknown task name: ${taskName}`);
            throw new Error(`Unknown task name: ${taskName}`);
        }

        try {
            await taskHandler();
            const duration = Date.now() - startTime;
            taskLogger.info({ durationMs: duration }, "Task completed");
        }
        catch (err: any) {
            taskLogger.error({ err }, "Task execution failed");
            throw err;
        }

        const duration = (Date.now() - startTime);
        taskLogger.info({ durationMs: duration }, "Task completed");
    }

    protected async runBulkMediaRefresh() {
        this.logger.info("Starting: Bulk Media Refresh execution.");

        for (const mediaType of this.mediaTypes) {
            this.logger.info({ mediaType }, `Refreshing media for ${mediaType}...`);

            const mediaProviderService = this.mediaProviderRegistry.getService(mediaType);
            const results = await mediaProviderService.bulkProcessAndRefreshMedia();
            results.forEach((result) => {
                if (result.status === "rejected") {
                    this.logger.error({ err: result.reason.message }, `Error refreshing ${mediaType}`);
                }
            });

            this.logger.info({ mediaType }, `Refreshing ${mediaType} completed.`);
        }

        this.logger.info("Completed: Bulk Media Refresh execution.");
    }

    protected async runVacuumDB() {
        this.logger.info("Starting: VacuumDB execution.");
        getDbClient().run("VACUUM");
        this.logger.info("Completed: VacuumDB execution.");
    }

    protected async runAnalyzeDB() {
        this.logger.info("Starting: AnalyzeDB execution.");
        getDbClient().run("ANALYZE");
        this.logger.info("Completed: AnalyzeDB execution.");
    }

    protected async runRemoveUnusedMediaCovers() {
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
            this.logger.info(`Found ${filesOnDisk.length} files in directory:`);

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

    protected async runLockOldMovies() {
        this.logger.info(`Starting locking movies older than 6 months...`);

        const moviesService = this.mediaServiceRegistry.getService(MediaType.MOVIES);
        const totalMoviesLocked = await moviesService.lockOldMovies();

        this.logger.info({ totalMoviesLocked }, `Locked ${totalMoviesLocked} movies older than 6 months.`);
        this.logger.info("Completed: LockOldMovies execution.");
    }

    protected async runSeedAchievements() {
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

    protected async runCalculateAchievements() {
        this.logger.info("Starting calculating all achievements...");

        const allAchievements = await this.achievementsService.allUsersAchievements();

        for (const mediaType of this.mediaTypes) {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const mediaAchievements = allAchievements.filter((all) => all.mediaType === mediaType);
            for (const achievement of mediaAchievements) {
                await this.achievementsService.calculateAchievement(achievement, mediaService);
            }
        }

        this.logger.info("Completed: CalculateAchievements execution.");
    }

    protected async runRemoveNonListMedia() {
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

    protected async runAddMediaNotifications() {
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

    protected async runComputeAllUsersStats() {
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

    protected async runUpdateIgdbToken() {
        this.logger.info("Starting: UpdateIgdbToken execution.");

        const gamesProviderService = this.mediaProviderRegistry.getService(MediaType.GAMES);
        const accessToken = await gamesProviderService.fetchNewIgdbToken();
        if (!accessToken) throw new Error("Failed to fetch new IGDB token.");

        await this._updateEnvFile("IGDB_API_KEY", accessToken);

        this.logger.info("IGDB token updated successfully.");
        this.logger.info("Completed: UpdateIgdbToken execution.");
    }

    protected async runDeleteNonActivatedUsers() {
        this.logger.info("Starting: DeleteNonActivatedUsers execution.");

        const deletedCount = await this.userRepository.deleteNonActivatedOldUsers();

        this.logger.info({ deletedCount }, `Deleted ${deletedCount} non-activated users older than a week.`);
        this.logger.info("Completed: DeleteNonActivatedUsers execution.");
    }

    protected async runMaintenanceTasks() {
        this.logger.info("Starting: MaintenanceTasks execution.");

        await this.runDeleteNonActivatedUsers();
        await this.runRemoveNonListMedia();
        await this.runRemoveUnusedMediaCovers();
        await this.runBulkMediaRefresh();
        await this.runAddMediaNotifications();
        await this.runLockOldMovies();
        await this.runComputeAllUsersStats();
        await this.runCalculateAchievements();
        await this.runVacuumDB();
        await this.runAnalyzeDB();

        this.logger.info("Completed: MaintenanceTasks execution.");
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
