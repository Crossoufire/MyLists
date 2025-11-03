import {MediadleService} from "@/lib/server/domain/mediadle/mediadle.service";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {MediadleRepository} from "@/lib/server/domain/mediadle/mediadle.repository";
import {AchievementsService} from "@/lib/server/domain/achievements/achievements.service";
import {NotificationsService} from "@/lib/server/domain/notifications/notifications.service";
import {AchievementsRepository} from "@/lib/server/domain/achievements/achievements.repository";
import {NotificationsRepository} from "@/lib/server/domain/notifications/notifications.repository";
import {UserRepository, UserService, UserStatsRepository, UserStatsService, UserUpdatesRepository, UserUpdatesService} from "@/lib/server/domain/user";


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
