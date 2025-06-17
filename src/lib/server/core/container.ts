import pino from "pino";
import {Cache} from "cache-manager";
import pinoLogger from "./pino-logger";
import {MediaType} from "@/lib/server/utils/enums";
import {initializeCache} from "@/lib/server/core/cache-manager";
import {GamesService} from "@/lib/server/domain/media/games/games.service";
import {UserService} from "@/lib/server/domain/user/services/user.service";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {IgdbClient} from "@/lib/server/media-providers/clients/igdb.client";
import {TasksService} from "@/lib/server/domain/tasks/services/tasks.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {IgdbTransformer} from "../media-providers/transformers/igdb.transformer";
import {MediadleService} from "@/lib/server/domain/user/services/mediadle.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {NotificationsService} from "@/lib/server/domain/user/services/notifications.service";
import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";
import {MediaProviderServiceRegistry, MediaRepositoryRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


interface AppContainer {
    cacheManager: Cache;
    clients: {
        igdb: IgdbClient;
        tmdb: TmdbClient;
    };
    transformers: {
        igdb: IgdbTransformer;
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
        mediaRepo: typeof MediaRepositoryRegistry;
        mediaService: typeof MediaServiceRegistry;
        mediaProviderService: typeof MediaProviderServiceRegistry;
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
    const gamesRepository = new GamesRepository()
    const moviesRepository = new MoviesRepository();
    MediaRepositoryRegistry.registerRepository(MediaType.GAMES, gamesRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.MOVIES, moviesRepository);

    // User Services
    const userService = new UserService(userRepository);
    const mediadleService = new MediadleService(mediadleRepository);
    const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
    const achievementsService = new AchievementsService(achievementsRepository);
    const notificationsService = new NotificationsService(notificationsRepository);
    const userStatsService = new UserStatsService(
        userStatsRepository,
        achievementsRepository,
        userUpdatesRepository,
        MediaServiceRegistry,
    );

    // Media Services
    const gamesService = new GamesService(gamesRepository);
    const moviesService = new MoviesService(moviesRepository);
    MediaServiceRegistry.registerService(MediaType.GAMES, gamesService);
    MediaServiceRegistry.registerService(MediaType.MOVIES, moviesService);

    // Tasks Service
    const tasksLogger = options.tasksServiceLogger || pinoLogger;
    const tasksService = new TasksService(
        tasksLogger,
        MediaServiceRegistry,
        MediaProviderServiceRegistry,
        achievementsService,
        userUpdatesService,
        notificationsService,
        userStatsService,
    )

    // API Transformers
    const igdbTransformer = new IgdbTransformer();
    const tmdbTransformer = new TmdbTransformer();

    // API Clients
    const igdbClient = await IgdbClient.create();
    const tmdbClient = await TmdbClient.create();

    // Media Providers Services
    const gamesProviderService = new GamesProviderService(igdbClient, igdbTransformer, gamesRepository)
    const moviesProviderService = new MoviesProviderService(tmdbClient, tmdbTransformer, moviesRepository);
    MediaProviderServiceRegistry.registerService(MediaType.MOVIES, moviesProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.GAMES, gamesProviderService);

    const currentContainer: AppContainer = {
        cacheManager: cacheManager,
        clients: {
            igdb: igdbClient,
            tmdb: tmdbClient,
        },
        transformers: {
            igdb: igdbTransformer,
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
            mediaRepo: MediaRepositoryRegistry,
            mediaService: MediaServiceRegistry,
            mediaProviderService: MediaProviderServiceRegistry,
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
        throw new Error("Global container not initialized. Ensure server.ts runs initializeContainer first.");
    }
    return globalContainer;
}
