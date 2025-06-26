import {ItemForNotification, UpdateMediaNotification} from "@/lib/server/types/base.types";
import {MediaType, NotificationType} from "@/lib/server/utils/enums";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";


export class NotificationsService {
    constructor(private repository: typeof NotificationsRepository) {
    }

    async sendMediaNotifications(mediaType: MediaType, mediaArray: ItemForNotification[]) {
        for (const item of mediaArray) {
            const notification = await this.repository.searchNotification(item.userId, mediaType, item.mediaId);

            let newNotification = {} as UpdateMediaNotification;
            if (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) {
                if (
                    notification &&
                    item.releaseDate === notification.payload.releaseDate &&
                    item.episodeToAir === notification.payload.releaseDate &&
                    item.seasonToAir === notification.payload.season
                ) {
                    continue;
                }

                newNotification = {
                    userId: item.userId,
                    mediaType: mediaType,
                    mediaId: item.mediaId,
                    notificationType: NotificationType.TV,
                    payload: {
                        name: item.mediaName,
                        season: item.seasonToAir,
                        episode: item.episodeToAir,
                        releaseDate: item.releaseDate,
                        final: (item.lastEpisode === item.episodeToAir && item.episodeToAir !== 1),
                    },
                };

                await this.repository.addNotification(newNotification);
                continue;
            }

            if (!notification) {
                newNotification = {
                    userId: item.userId,
                    mediaType: mediaType,
                    mediaId: item.mediaId,
                    notificationType: NotificationType.MEDIA,
                    payload: {
                        name: item.mediaName,
                        releaseDate: item.releaseDate,
                    },
                };

                await this.repository.addNotification(newNotification);
            }
        }
    }

    async sendNotification(userId: number, notificationType: NotificationType, payload: Record<string, any>) {
        return this.repository.sendNotification(userId, notificationType, payload);
    }

    async getLastNotifications(userId: number, limit = 8) {
        return this.repository.getLastNotifications(userId, limit);
    }

    async countUnreadNotifications(userId: number, lastReadTime: string | null) {
        return this.repository.countUnreadNotifications(userId, lastReadTime);
    }

    async deleteNotifications(mediaType: MediaType, mediaIds: number[]) {
        return this.repository.deleteNotifications(mediaType, mediaIds);
    }
}
