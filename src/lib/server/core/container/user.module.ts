import {MediadleService} from "@/lib/server/domain/mediadle/mediadle.service";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {MediadleRepository} from "@/lib/server/domain/mediadle/mediadle.repository";
import {CollectionsService} from "@/lib/server/domain/collections/collections.service";
import {AchievementsService} from "@/lib/server/domain/achievements/achievements.service";
import {FeatureVotesService} from "@/lib/server/domain/feature-votes/feature-votes.service";
import {NotificationsService} from "@/lib/server/domain/notifications/notifications.service";
import {CollectionsRepository} from "@/lib/server/domain/collections/collections.repository";
import {AchievementsRepository} from "@/lib/server/domain/achievements/achievements.repository";
import {FeatureVotesRepository} from "@/lib/server/domain/feature-votes/feature-votes.repository";
import {NotificationsRepository} from "@/lib/server/domain/notifications/notifications.repository";
import {
    UserMediaService,
    UserProfileRepository,
    UserProfileService,
    UserRepository,
    UserService,
    UserStatsRepository,
    UserStatsService,
    UserUpdatesRepository,
    UserUpdatesService
} from "@/lib/server/domain/user";


export function setupUserModule(mediaServiceRegistry: typeof MediaServiceRegistry) {
    // User Repositories
    const userRepository = UserRepository;
    const mediadleRepository = MediadleRepository;
    const userStatsRepository = UserStatsRepository;
    const userUpdatesRepository = UserUpdatesRepository;
    const userProfileRepository = UserProfileRepository;
    const collectionsRepository = CollectionsRepository;
    const achievementsRepository = AchievementsRepository;
    const featureVotesRepository = FeatureVotesRepository;
    const notificationsRepository = NotificationsRepository;

    // User Services
    const userService = new UserService(userRepository);
    const mediadleService = new MediadleService(mediadleRepository);
    const userUpdatesService = new UserUpdatesService(userUpdatesRepository);
    const achievementsService = new AchievementsService(achievementsRepository);
    const notificationsService = new NotificationsService(notificationsRepository);
    const userProfileService = new UserProfileService(userProfileRepository, mediaServiceRegistry);
    const featureVotesService = new FeatureVotesService(featureVotesRepository, notificationsService);
    const collectionsService = new CollectionsService(userService, collectionsRepository, mediaServiceRegistry);
    const userStatsService = new UserStatsService(userStatsRepository, achievementsRepository, userUpdatesRepository, mediaServiceRegistry);
    const userMediaService = new UserMediaService(userStatsService, userUpdatesService, notificationsService, mediaServiceRegistry);

    return {
        repositories: {
            user: userRepository,
            mediadle: mediadleRepository,
            userStats: userStatsRepository,
            userUpdates: userUpdatesRepository,
            userProfile: userProfileRepository,
            collections: collectionsRepository,
            achievements: achievementsRepository,
            featureVotes: featureVotesRepository,
            notifications: notificationsRepository,
        },
        services: {
            user: userService,
            mediadle: mediadleService,
            userMedia: userMediaService,
            userStats: userStatsService,
            userProfile: userProfileService,
            userUpdates: userUpdatesService,
            collections: collectionsService,
            achievements: achievementsService,
            featureVotes: featureVotesService,
            notifications: notificationsService,
        },
    };
}


export type UserModule = ReturnType<typeof setupUserModule>;
