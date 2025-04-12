/**
 * Wire services, repositories, registries, and strategies.
 * Used for internal use as well as with the media providers.
 * This allows for easy dependency injection.
 */

import {MediaType} from "@/lib/server/utils/enums";
import {UserService} from "@/lib/server/domain/user/services/user.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {TmdbClient} from "@/lib/server/domain/media-providers/clients/tmdb.client";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {MediaRepoRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/base/base.registry";
import {TmdbTransformer} from "@/lib/server/domain/media-providers/transformers/tmdb.transformer";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {TmdbMoviesStrategy} from "@/lib/server/domain/media-providers/strategies/tmdb-movies.strategy";
import {ProviderStrategyRegistry} from "@/lib/server/domain/media-providers/registries/provider-strategy.registry";


// Initialize user repositories
const userRepository = UserRepository;
const userStatsRepository = UserStatsRepository;
const userUpdatesRepository = UserUpdatesRepository;
const achievementsRepository = AchievementsRepository;

// Initialize media repositories
const moviesRepository = new MoviesRepository();
MediaRepoRegistry.registerRepository(MediaType.MOVIES, moviesRepository);

// Initialize user services
const userService = new UserService(userRepository);
const userStatsService = new UserStatsService(userStatsRepository, MediaRepoRegistry, achievementsRepository, userUpdatesRepository);
const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
const achievementsService = new AchievementsService(achievementsRepository);

// initialize media services
const moviesService = new MoviesService(moviesRepository);
MediaServiceRegistry.registerService(MediaType.MOVIES, moviesService);

// --- Media Providers --------------------------------------------------------------------------------------------

// API Clients
const tmdbClient = new TmdbClient();

// API Transformers
const tmdbTransformer = new TmdbTransformer();

// Provider strategies
const tmdbMovieStrategy = new TmdbMoviesStrategy(tmdbClient, tmdbTransformer, moviesRepository);
ProviderStrategyRegistry.registerStrategy(MediaType.MOVIES, tmdbMovieStrategy);

export const container = {
    clients: {
        tmdb: tmdbClient
    },
    transformers: {
        tmdb: tmdbTransformer
    },
    repositories: {
        user: userRepository,
        userStats: userStatsRepository,
        userUpdates: userUpdatesRepository,
        achievements: achievementsRepository
    },
    services: {
        user: userService,
        userStats: userStatsService,
        userUpdates: userUpdatesService,
        achievements: achievementsService
    },
    registries: {
        mediaRepo: MediaRepoRegistry,
        mediaService: MediaServiceRegistry,
        mediaStrategy: ProviderStrategyRegistry,
    }
};
