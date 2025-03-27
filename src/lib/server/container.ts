import { MediaType } from "@/lib/server/utils/enums";
import { MediaRegistry, MediaServiceRegistry } from "@/lib/server/registries/media.registry";
import { UserRegistry } from "@/lib/server/registries/user.registry";
import { UserRepository } from "@/lib/server/repositories/user/user.repository";
import { UserStatsRepository } from "@/lib/server/repositories/user/user-stats.repository";
import { MoviesRepository } from "@/lib/server/repositories/media/movies.repository";
import { UserService } from "@/lib/server/services/user/user.service";
import { UserStatsService } from "@/lib/server/services/user/user-stats.service";
import { UserUpdatesService } from "./services/user/user-updates.service";
import { UserUpdatesRepository } from "@/lib/server/repositories/user/user-updates.repository";


// Initialize repositories
const userRepository = UserRepository;
const userStatsRepository = UserStatsRepository;
const moviesRepository = new MoviesRepository();
const userUpdatesRepository = UserUpdatesRepository;

// Register repositories in registries
MediaRegistry.registerRepository(MediaType.MOVIES, moviesRepository);

// Initialize services with their dependencies
const userService = new UserService(userRepository);
const userStatsService = new UserStatsService(userStatsRepository, MediaRegistry);
const userUpdatesService = new UserUpdatesService(userUpdatesRepository);

// Register services in registries
UserRegistry.registerService('user', userService);
UserRegistry.registerService('userStats', userStatsService);


export const container = {
    // Repositories
    repositories: {
        user: userRepository,
        userStats: userStatsRepository,
        movies: moviesRepository,
    },

    // Services
    services: {
        user: userService,
        userStats: userStatsService,
        userUpdates: userUpdatesService,
    },

    // Registries
    registries: {
        media: MediaRegistry,
        mediaService: MediaServiceRegistry,
        user: UserRegistry,
    }
};
