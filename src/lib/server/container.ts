import {MediaType} from "@/lib/server/utils/enums";
import {UserRegistry} from "@/lib/server/registries/user.registry";
import {UserService} from "@/lib/server/services/user/user.service";
import {UserUpdatesService} from "./services/user/user-updates.service";
import {UserRepository} from "@/lib/server/repositories/user/user.repository";
import {UserStatsService} from "@/lib/server/services/user/user-stats.service";
import {AchievementsRegistry} from "@/lib/server/registries/achievements.registry";
import {MoviesRepository} from "@/lib/server/repositories/media/movies.repository";
import {AchievementsService} from "@/lib/server/services/user/achievements.service";
import {UserStatsRepository} from "@/lib/server/repositories/user/user-stats.repository";
import {MediaRegistry, MediaServiceRegistry} from "@/lib/server/registries/media.registry";
import {UserUpdatesRepository} from "@/lib/server/repositories/user/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/repositories/user/achievements.repository";


// Initialize repositories
const userRepository = UserRepository;
const userStatsRepository = UserStatsRepository;
const moviesRepository = new MoviesRepository();
const userUpdatesRepository = UserUpdatesRepository;
const achievementsRepository = AchievementsRepository;

// Register repositories in registries
MediaRegistry.registerRepository(MediaType.MOVIES, moviesRepository);

// Initialize services with their dependencies
const userService = new UserService(userRepository);
const userStatsService = new UserStatsService(userStatsRepository, MediaRegistry);
const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
const achievementsService = new AchievementsService(achievementsRepository);

// Register services in registries
UserRegistry.registerService('user', userService);
UserRegistry.registerService('userStats', userStatsService);
UserRegistry.registerService('userUpdates', userUpdatesService);
AchievementsRegistry.registerService('achievements', achievementsService);


export const container = {
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
        media: MediaRegistry,
        mediaService: MediaServiceRegistry,
        achievements: AchievementsRegistry
    }
};
