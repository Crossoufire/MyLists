/**
 * Wire services, repositories, registries, and strategies.
 * Used for internal use as well as with the media providers.
 * This allows for easy dependency injection.
 */

import {MediaType} from "@/lib/server/utils/enums";
import {UserService} from "@/lib/server/domain/user/services/user.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {UserRegistry} from "@/lib/server/domain/user/registries/user.registry";
import {TmdbClient} from "@/lib/server/domain/media-providers/clients/tmdb.client";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {AchievementsRegistry} from "@/lib/server/domain/user/registries/achievements.registry";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {MediaRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/base/base.registry";
import {TmdbTransformer} from "@/lib/server/domain/media-providers/transformers/tmdb.transformer";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {TmdbMoviesStrategy} from "@/lib/server/domain/media-providers/strategies/tmdb-movies.strategy";
import {ProviderServiceRegistry} from "@/lib/server/domain/media-providers/registries/provider-service.registry";
import {ProviderStrategyRegistry} from "@/lib/server/domain/media-providers/registries/provider-strategy.registry";


// Initialize user repositories
const userRepository = UserRepository;
const userStatsRepository = UserStatsRepository;
const userUpdatesRepository = UserUpdatesRepository;
const achievementsRepository = AchievementsRepository;

// Initialize media repositories
const moviesRepository = new MoviesRepository();

// Register media repositories
MediaRegistry.registerRepository(MediaType.MOVIES, moviesRepository);

// Initialize user services
const userService = new UserService(userRepository);
const userStatsService = new UserStatsService(userStatsRepository, MediaRegistry, achievementsRepository, userUpdatesRepository);
const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
const achievementsService = new AchievementsService(achievementsRepository);

// initialize media services
const moviesService = new MoviesService(moviesRepository);

// Register services
UserRegistry.registerService("user", userService);
UserRegistry.registerService("userStats", userStatsService);
UserRegistry.registerService("userUpdates", userUpdatesService);
AchievementsRegistry.registerService("achievements", achievementsService);

MediaServiceRegistry.registerService(MediaType.MOVIES, moviesService);

// --- Media Providers --------------------------------------------------------------------------------------------

// API Clients
const tmdbClient = new TmdbClient();

// API Transformers
const tmdbTransformer = new TmdbTransformer();

// Provider Services

// Provider strategies
const tmdbMovieStrategy = new TmdbMoviesStrategy(tmdbClient, tmdbTransformer, moviesRepository);

// Register provider services
// ProviderServiceRegistry.registerService(ApiProviderType.TMDB, tmdbMoviesProvider);

// Register provider strategies
ProviderStrategyRegistry.registerStrategy(MediaType.MOVIES, tmdbMovieStrategy);

export const container = {
    // API clients
    clients: {
        tmdb: tmdbClient
    },

    // API transformers
    transformers: {
        tmdb: tmdbTransformer
    },

    // Provider Services
    providerServices: {
        // tmdb: tmdbMoviesProvider
    },

    // Repositories
    repositories: {
        user: userRepository,
        movies: moviesRepository,
        userStats: userStatsRepository,
        userUpdates: userUpdatesRepository,
        achievements: achievementsRepository
    },

    // Services
    services: {
        user: userService,
        userStats: userStatsService,
        userUpdates: userUpdatesService,
        achievements: achievementsService
    },

    // Registries
    registries: {
        user: UserRegistry,
        mediaRepo: MediaRegistry,
        mediaService: MediaServiceRegistry,
        achievements: AchievementsRegistry,
        provider: ProviderServiceRegistry,
        strategy: ProviderStrategyRegistry,
    }
};
