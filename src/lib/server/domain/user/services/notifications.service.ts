import {MediaType, NotificationType} from "@/lib/server/utils/enums";
import {UpComingMedia, UpdateMediaNotification} from "@/lib/server/types/base.types";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";


export class NotificationsService {
    constructor(private repository: typeof NotificationsRepository) {
    }

    async sendMediaNotifications(mediaType: MediaType, mediaArray: UpComingMedia[]) {
        for (const item of mediaArray) {
            const notification = await this.repository.searchNotification(item.userId, mediaType, item.mediaId);

            let newNotification = {} as UpdateMediaNotification;
            if (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) {
                if (
                    notification &&
                    item.date === notification.payload.releaseDate &&
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
                        releaseDate: item.date,
                        season: item.seasonToAir,
                        episode: item.episodeToAir,
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
                        releaseDate: item.date,
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

    async countUnreadNotifications(userId: number, lastReadTime: Date | null) {
        return this.repository.countUnreadNotifications(userId, lastReadTime);
    }

    async deleteNotifications(mediaType: MediaType, mediaIds: number[]) {
        return this.repository.deleteNotifications(mediaType, mediaIds);
    }

    async deleteUserMediaNotifications(userId: number, mediaType: MediaType, mediaId: number) {
        return this.repository.deleteUserMediaNotifications(userId, mediaType, mediaId);
    }
}
