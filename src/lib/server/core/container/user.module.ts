import {UserService} from "@/lib/server/domain/user/services/user.service";
import {MediadleService} from "@/lib/server/domain/user/services/mediadle.service";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";
import {UserStatsService} from "@/lib/server/domain/user/services/user-stats.service";
import {UserUpdatesService} from "@/lib/server/domain/user/services/user-updates.service";
import {AchievementsService} from "@/lib/server/domain/user/services/achievements.service";
import {NotificationsService} from "@/lib/server/domain/user/services/notifications.service";
import {MediadleRepository} from "@/lib/server/domain/user/repositories/mediadle.repository";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";


export function setupUserModule(mediaServiceRegistry: typeof MediaServiceRegistry) {
    // User Repositories
    const userRepository = UserRepository;
    const mediadleRepository = MediadleRepository;
    const userStatsRepository = UserStatsRepository;
    const userUpdatesRepository = UserUpdatesRepository;
    const achievementsRepository = AchievementsRepository;
    const notificationsRepository = NotificationsRepository;

    // User Services
    const userService = new UserService(userRepository);
    const mediadleService = new MediadleService(mediadleRepository);
    const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
    const achievementsService = new AchievementsService(achievementsRepository);
    const notificationsService = new NotificationsService(notificationsRepository);
    const userStatsService = new UserStatsService(userStatsRepository, achievementsRepository, userUpdatesRepository, mediaServiceRegistry);

    return {
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
            mediadle: mediadleService,
            userStats: userStatsService,
            userUpdates: userUpdatesService,
            achievements: achievementsService,
            notifications: notificationsService,
        },
    };
}


export type UserModule = ReturnType<typeof setupUserModule>;
