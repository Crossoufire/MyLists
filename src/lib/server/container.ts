/**
 * Wire every service, repository, registry, strategy, and coordinator.
 * Used for internal use as well as with the media providers.
 * This allows for easy dependency injection.
 */

import {MediaType} from "@/lib/server/utils/enums";
import {UserRegistry} from "@/lib/server/registries/user.registry";
import {UserService} from "@/lib/server/services/user/user.service";
import {GamesRepository} from "./repositories/media/games.repository";
import {UserUpdatesService} from "./services/user/user-updates.service";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {UserRepository} from "@/lib/server/repositories/user/user.repository";
import {UserStatsService} from "@/lib/server/services/user/user-stats.service";
import {MangaRepository} from "@/lib/server/repositories/media/manga.repository";
import {AnimeRepository} from "@/lib/server/repositories/media/anime.repository";
import {BooksRepository} from "@/lib/server/repositories/media/books.repository";
import {AchievementsRegistry} from "@/lib/server/registries/achievements.registry";
import {MoviesRepository} from "@/lib/server/repositories/media/movies.repository";
import {SeriesRepository} from "@/lib/server/repositories/media/series.repository";
import {AchievementsService} from "@/lib/server/services/user/achievements.service";
import {UserStatsRepository} from "@/lib/server/repositories/user/user-stats.repository";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";
import {UserUpdatesRepository} from "@/lib/server/repositories/user/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/repositories/user/achievements.repository";
import {ProviderServiceRegistry} from "./media-providers/registries/provider-service.registry";
import {MediaRepoRegistry, MediaServiceRegistry} from "@/lib/server/registries/media-repo.registry";
import {ProviderStrategyRegistry} from "@/lib/server/media-providers/registries/provider-strategy.registry";
import {MoviesService} from "@/lib/server/services/media/movies.service";
import {TmdbMoviesStrategy} from "@/lib/server/media-providers/strategies/tmdb-movies.strategy";


// Initialize user repositories
const userRepository = UserRepository;
const userStatsRepository = UserStatsRepository;
const userUpdatesRepository = UserUpdatesRepository;
const achievementsRepository = AchievementsRepository;

// Initialize media repositories
const seriesRepository = new SeriesRepository();
const animeRepository = new AnimeRepository();
const moviesRepository = new MoviesRepository();
const gamesRepository = new GamesRepository();
const booksRepository = new BooksRepository();
const mangaRepository = new MangaRepository();

// Register media repositories
MediaRepoRegistry.registerRepository(MediaType.SERIES, seriesRepository);
MediaRepoRegistry.registerRepository(MediaType.ANIME, animeRepository);
MediaRepoRegistry.registerRepository(MediaType.MOVIES, moviesRepository);
MediaRepoRegistry.registerRepository(MediaType.GAMES, gamesRepository);
MediaRepoRegistry.registerRepository(MediaType.BOOKS, booksRepository);
MediaRepoRegistry.registerRepository(MediaType.MANGA, mangaRepository);

// Initialize user services
const userService = new UserService(userRepository);
const userStatsService = new UserStatsService(userStatsRepository, MediaRepoRegistry);
const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
const achievementsService = new AchievementsService(achievementsRepository);

// initialize media services
const moviesService = new MoviesService(moviesRepository);

// Register services
UserRegistry.registerService('user', userService);
UserRegistry.registerService('userStats', userStatsService);
UserRegistry.registerService('userUpdates', userUpdatesService);
AchievementsRegistry.registerService('achievements', achievementsService);

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
        series: seriesRepository,
        anime: animeRepository,
        movies: moviesRepository,
        books: booksRepository,
        manga: mangaRepository,
        games: gamesRepository,
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
        mediaRepo: MediaRepoRegistry,
        mediaService: MediaServiceRegistry,
        achievements: AchievementsRegistry,
        provider: ProviderServiceRegistry,
        strategy: ProviderStrategyRegistry,
    }
};
