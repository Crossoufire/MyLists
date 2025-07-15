import pino from "pino";
import {Cache} from "cache-manager";
import pinoLogger from "./pino-logger";
import {MediaType} from "@/lib/server/utils/enums";
import {initializeCache} from "@/lib/server/core/cache-manager";
import {TvService} from "@/lib/server/domain/media/tv/tv.service";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {GamesService} from "@/lib/server/domain/media/games/games.service";
import {UserService} from "@/lib/server/domain/user/services/user.service";
import {animeConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {TmdbClient} from "@/lib/server/api-providers/clients/tmdb.client";
import {IgdbClient} from "@/lib/server/api-providers/clients/igdb.client";
import {HltbClient} from "@/lib/server/api-providers/clients/hltb.client";
import {JikanClient} from "@/lib/server/api-providers/clients/jikan.client";
import {TasksService} from "@/lib/server/domain/tasks/services/tasks.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {seriesConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {IgdbTransformer} from "@/lib/server/api-providers/transformers/igdb.transformer";
import {MediadleService} from "@/lib/server/domain/user/services/mediadle.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {TmdbTransformer} from "@/lib/server/api-providers/transformers/tmdb.transformer";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {NotificationsService} from "@/lib/server/domain/user/services/notifications.service";
import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {AnimeProviderService} from "@/lib/server/domain/media/tv/anime/anime-provider.service";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {SeriesProviderService} from "@/lib/server/domain/media/tv/series/series-provider.service";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";
import {MediaProviderServiceRegistry, MediaRepositoryRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


interface AppContainer {
    cacheManager: Cache;
    clients: {
        igdb: IgdbClient;
        tmdb: TmdbClient;
        jikan: JikanClient;
    };
    transformers: {
        igdb: IgdbTransformer;
        tmdb: TmdbTransformer;
        // jikan: JikanTransformer;
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


let containerPromise: Promise<AppContainer> | null = null;


async function initializeContainer(options: ContainerOptions = {}) {
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
    const gamesRepository = new GamesRepository();
    const moviesRepository = new MoviesRepository();
    const animeRepository = new TvRepository(animeConfig);
    const seriesRepository = new TvRepository(seriesConfig);
    MediaRepositoryRegistry.registerRepository(MediaType.GAMES, gamesRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.ANIME, animeRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.SERIES, seriesRepository);
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
    const seriesService = new TvService(seriesRepository);
    const animeService = new TvService(animeRepository);
    MediaServiceRegistry.registerService(MediaType.GAMES, gamesService);
    MediaServiceRegistry.registerService(MediaType.ANIME, animeService);
    MediaServiceRegistry.registerService(MediaType.SERIES, seriesService);
    MediaServiceRegistry.registerService(MediaType.MOVIES, moviesService);

    // Tasks Service
    const tasksLogger = options.tasksServiceLogger || pinoLogger;
    const tasksService = new TasksService(
        tasksLogger,
        userRepository,
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
    const hltbClient = await HltbClient.create();
    const igdbClient = await IgdbClient.create();
    const tmdbClient = await TmdbClient.create();
    const jikanClient = await JikanClient.create();

    // Media Providers Services
    const gamesProviderService = new GamesProviderService(igdbClient, hltbClient, igdbTransformer, gamesRepository)
    const moviesProviderService = new MoviesProviderService(tmdbClient, tmdbTransformer, moviesRepository);
    const seriesProviderService = new SeriesProviderService(tmdbClient, tmdbTransformer, seriesRepository);
    const animeProviderService = new AnimeProviderService(tmdbClient, jikanClient, tmdbTransformer, animeRepository);
    MediaProviderServiceRegistry.registerService(MediaType.MOVIES, moviesProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.GAMES, gamesProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.ANIME, animeProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.SERIES, seriesProviderService);

    return {
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
    } as AppContainer;
}


export function getContainer(options: ContainerOptions = {}) {
    if (!containerPromise) {
        containerPromise = initializeContainer(options).then((container) => container);
    }
    return containerPromise;
}
