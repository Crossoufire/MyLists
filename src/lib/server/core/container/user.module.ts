import {MediadleService} from "@/lib/server/domain/mediadle/mediadle.service";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {MediadleRepository} from "@/lib/server/domain/mediadle/mediadle.repository";
import {AchievementsService} from "@/lib/server/domain/achievements/achievements.service";
import {CollectionsService} from "@/lib/server/domain/collections/collections.service";
import {FeatureVotesService} from "@/lib/server/domain/feature-votes/feature-votes.service";
import {NotificationsService} from "@/lib/server/domain/notifications/notifications.service";
import {AchievementsRepository} from "@/lib/server/domain/achievements/achievements.repository";
import {CollectionsRepository} from "@/lib/server/domain/collections/collections.repository";
import {FeatureVotesRepository} from "@/lib/server/domain/feature-votes/feature-votes.repository";
import {NotificationsRepository} from "@/lib/server/domain/notifications/notifications.repository";
import {UserRepository, UserService, UserStatsRepository, UserStatsService, UserUpdatesRepository, UserUpdatesService} from "@/lib/server/domain/user";


export function setupUserModule(mediaServiceRegistry: typeof MediaServiceRegistry) {
    // User Repositories
    const userRepository = UserRepository;
    const mediadleRepository = MediadleRepository;
    const userStatsRepository = UserStatsRepository;
    const userUpdatesRepository = UserUpdatesRepository;
    const collectionsRepository = CollectionsRepository;
    const achievementsRepository = AchievementsRepository;
    const featureVotesRepository = FeatureVotesRepository;
    const notificationsRepository = NotificationsRepository;

    // User Services
    const userService = new UserService(userRepository);
    const mediadleService = new MediadleService(mediadleRepository);
    const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
    const featureVotesService = new FeatureVotesService(featureVotesRepository);
    const achievementsService = new AchievementsService(achievementsRepository);
    const notificationsService = new NotificationsService(notificationsRepository);
    const collectionsService = new CollectionsService(userService, collectionsRepository, mediaServiceRegistry);
    const userStatsService = new UserStatsService(userStatsRepository, achievementsRepository, userUpdatesRepository, mediaServiceRegistry);

    return {
        repositories: {
            user: userRepository,
            mediadle: mediadleRepository,
            userStats: userStatsRepository,
            userUpdates: userUpdatesRepository,
            collections: collectionsRepository,
            achievements: achievementsRepository,
            featureVotes: featureVotesRepository,
            notifications: notificationsRepository,
        },
        services: {
            user: userService,
            mediadle: mediadleService,
            userStats: userStatsService,
            userUpdates: userUpdatesService,
            collections: collectionsService,
            achievements: achievementsService,
            featureVotes: featureVotesService,
            notifications: notificationsService,
        },
    };
}


export type UserModule = ReturnType<typeof setupUserModule>;
