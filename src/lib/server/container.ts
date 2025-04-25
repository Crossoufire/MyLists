/**
 * Wire services, repositories, registries, and strategies.
 * Used for internal use as well as with the media providers.
 * This allows for easy dependency injection.
 */

import {MediaType} from "@/lib/server/utils/enums";
import {UserService} from "@/lib/server/domain/user/services/user.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {MediadleService} from "@/lib/server/domain/user/services/mediadle.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {NotificationsRepository} from "./domain/user/repositories/notifications.repository";
import {NotificationsService} from "@/lib/server/domain/user/services/notifications.service";
import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {MediaProviderRegistry, MediaRepoRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";


// Initialize user repositories
const userRepository = UserRepository;
const mediadleRepository = MediadleRepository;
const userStatsRepository = UserStatsRepository;
const userUpdatesRepository = UserUpdatesRepository;
const achievementsRepository = AchievementsRepository;
const notificationsRepository = NotificationsRepository;

// Initialize media repositories
const moviesRepository = new MoviesRepository();
MediaRepoRegistry.registerRepository(MediaType.MOVIES, moviesRepository);

// Initialize user services
const userService = new UserService(userRepository);
const userStatsService = new UserStatsService(userStatsRepository, MediaRepoRegistry, achievementsRepository, userUpdatesRepository);
const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
const achievementsService = new AchievementsService(achievementsRepository);
const notificationsService = new NotificationsService(notificationsRepository);
const mediadleService = new MediadleService(mediadleRepository);

// initialize media services
const moviesService = new MoviesService(moviesRepository);
MediaServiceRegistry.registerService(MediaType.MOVIES, moviesService);

// --- Media Providers --------------------------------------------------------------------------------------------

// API Clients
const tmdbClient = new TmdbClient();

// API Transformers
const tmdbTransformer = new TmdbTransformer();

// Media Providers Services
const moviesProviderService = new MoviesProviderService(tmdbClient, tmdbTransformer, moviesRepository);
MediaProviderRegistry.registerService(MediaType.MOVIES, moviesProviderService);

export const container = {
    clients: {
        tmdb: tmdbClient,
    },
    transformers: {
        tmdb: tmdbTransformer,
    },
    repositories: {
        user: userRepository,
        userStats: userStatsRepository,
        userUpdates: userUpdatesRepository,
        achievements: achievementsRepository,
        notifications: notificationsRepository,
        mediadle: mediadleRepository,
    },
    services: {
        user: userService,
        userStats: userStatsService,
        userUpdates: userUpdatesService,
        achievements: achievementsService,
        notifications: notificationsService,
        mediadle: mediadleService,
    },
    providersServices: {
        movies: moviesProviderService,
    },
    registries: {
        mediaRepo: MediaRepoRegistry,
        mediaService: MediaServiceRegistry,
        mediaProviderService: MediaProviderRegistry,
    }
};
