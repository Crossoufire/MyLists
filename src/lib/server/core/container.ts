import pino from "pino";
import {Cache} from "cache-manager";
import pinoLogger from "./pino-logger";
import {MediaType} from "@/lib/server/utils/enums";
import {initializeCache} from "@/lib/server/core/cache-manager";
import {UserService} from "@/lib/server/domain/user/services/user.service";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {TasksService} from "@/lib/server/domain/tasks/services/tasks.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {MediadleService} from "@/lib/server/domain/user/services/mediadle.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";
import {NotificationsService} from "@/lib/server/domain/user/services/notifications.service";
import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";
import {MediaProviderRegistry, MediaRepoRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


interface AppContainer {
    cacheManager: Cache;
    clients: {
        tmdb: TmdbClient;
    };
    transformers: {
        tmdb: TmdbTransformer;
    };
    repositories: {
        user: typeof UserRepository;
        mediadle: typeof MediadleRepository;
        userStats: typeof UserStatsRepository;
        userUpdates: typeof UserUpdatesRepository;
        achievements: typeof AchievementsRepository;
        notifications: typeof NotificationsRepository;
    };
    services: {
        user: UserService;
        tasks: TasksService;
        mediadle: MediadleService;
        userStats: UserStatsService;
        userUpdates: UserUpdatesService;
        achievements: AchievementsService;
        notifications: NotificationsService;
    };
    registries: {
        mediaRepo: typeof MediaRepoRegistry;
        mediaService: typeof MediaServiceRegistry;
        mediaProviderService: typeof MediaProviderRegistry;
    };
}


interface ContainerOptions {
    tasksServiceLogger?: pino.Logger;
}


declare global {
    var __MY_APP_CONTAINER: AppContainer | undefined;
}


export async function initializeContainer(options: ContainerOptions = {}) {
    if (globalThis.__MY_APP_CONTAINER && !options.tasksServiceLogger) {
        return globalThis.__MY_APP_CONTAINER;
    }

    // Initialize cache manager
    const cacheManager = await initializeCache();

    // Users Repositories
    const userRepository = UserRepository;
    const mediadleRepository = MediadleRepository;
    const userStatsRepository = UserStatsRepository;
    const userUpdatesRepository = UserUpdatesRepository;
    const achievementsRepository = AchievementsRepository;
    const notificationsRepository = NotificationsRepository;

    // Media Repositories
    const moviesRepository = new MoviesRepository();
    MediaRepoRegistry.registerRepository(MediaType.MOVIES, moviesRepository);

    // User Services
    const userService = new UserService(userRepository);
    const mediadleService = new MediadleService(mediadleRepository);
    const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
    const achievementsService = new AchievementsService(achievementsRepository);
    const notificationsService = new NotificationsService(notificationsRepository);
    const userStatsService = new UserStatsService(userStatsRepository, MediaRepoRegistry, achievementsRepository, userUpdatesRepository);

    // Media Services
    const moviesService = new MoviesService(moviesRepository);
    MediaServiceRegistry.registerService(MediaType.MOVIES, moviesService);

    // Tasks Service
    const tasksLogger = options.tasksServiceLogger || pinoLogger;
    const tasksService = new TasksService(
        tasksLogger,
        MediaServiceRegistry,
        MediaProviderRegistry,
        achievementsService,
        userUpdatesService,
        notificationsService,
    )

    // API Transformers
    const tmdbTransformer = new TmdbTransformer();

    // API Clients
    const tmdbClient = await TmdbClient.create();

    // Media Providers Services
    const moviesProviderService = new MoviesProviderService(tmdbClient, tmdbTransformer, moviesRepository);
    MediaProviderRegistry.registerService(MediaType.MOVIES, moviesProviderService);

    const currentContainer: AppContainer = {
        cacheManager: cacheManager,
        clients: {
            tmdb: tmdbClient,
        },
        transformers: {
            tmdb: tmdbTransformer,
        },
        repositories: {
            user: userRepository,
            mediadle: mediadleRepository,
            userStats: userStatsRepository,
            userUpdates: userUpdatesRepository,
            achievements: achievementsRepository,
            notifications: notificationsRepository,
        },
        services: {
            user: userService,
            tasks: tasksService,
            mediadle: mediadleService,
            userStats: userStatsService,
            userUpdates: userUpdatesService,
            achievements: achievementsService,
            notifications: notificationsService,
        },
        registries: {
            mediaRepo: MediaRepoRegistry,
            mediaService: MediaServiceRegistry,
            mediaProviderService: MediaProviderRegistry,
        },
    };

    if (!globalThis.__MY_APP_CONTAINER) {
        globalThis.__MY_APP_CONTAINER = currentContainer;
    }

    return currentContainer;
}


export function getContainer() {
    const globalContainer = globalThis.__MY_APP_CONTAINER;
    if (!globalContainer) {
        throw new Error("Global container not initialized. Ensure SSR or relevant entry point runs initializeContainer first.");
    }
    return globalContainer;
}
