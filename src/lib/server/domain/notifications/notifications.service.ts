import {MediaType, SocialNotifType} from "@/lib/utils/enums";
import {NotifTab, UpComingMedia} from "@/lib/types/base.types";
import {NotificationsRepository} from "@/lib/server/domain/notifications/notifications.repository";


export class NotificationsService {
    constructor(private repository: typeof NotificationsRepository) {
    }

    // --- Social Notifications -----------------------------

    async deleteSocialNotifsBetweenUsers(recipientId: number, actorId: number, types: SocialNotifType[]) {
        await this.repository.deleteSocialNotifsBetweenUsers(recipientId, actorId, types);
    }

    async createSocialNotification(data: { userId: number; actorId: number; type: SocialNotifType }) {
        await this.repository.createSocialNotification(data);
    }

    async deleteSocialNotif(userId: number, notificationId: number) {
        return this.repository.deleteSocialNotif(userId, notificationId);
    }

    // --- Media Notifications -----------------------------

    async createMediaNotifications(mediaType: MediaType, mediaArray: UpComingMedia[]) {
        const isSameDate = (d1: any, d2: any) => {
            const time1 = new Date(d1).getTime();
            const time2 = new Date(d2).getTime();

            if (isNaN(time1) || isNaN(time2)) return false;
            return time1 === time2;
        };

        for (const item of mediaArray) {
            const notification = await this.repository.searchMediaNotification(item.userId, mediaType, item.mediaId);

            if (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) {
                if (
                    notification
                    && isSameDate(notification.releaseDate, item.date) &&
                    notification.episode === item.episodeToAir &&
                    notification.season === item.seasonToAir
                ) {
                    continue;
                }

                await this.repository.createMediaNotification({
                    userId: item.userId,
                    name: item.mediaName,
                    mediaType: mediaType,
                    mediaId: item.mediaId,
                    releaseDate: item.date,
                    season: item.seasonToAir,
                    episode: item.episodeToAir,
                    isSeasonFinale: item.lastEpisode === item.episodeToAir && item.episodeToAir !== 1,
                });
            }
            else {
                if (notification && isSameDate(notification.releaseDate, item.date)) {
                    continue;
                }

                await this.repository.createMediaNotification({
                    userId: item.userId,
                    name: item.mediaName,
                    mediaType: mediaType,
                    mediaId: item.mediaId,
                    releaseDate: item.date,
                });
            }
        }
    }

    async deleteMediaNotifications(mediaType: MediaType, mediaIds: number[]) {
        return this.repository.deleteMediaNotifications(mediaType, mediaIds);
    }

    async deleteUserMediaNotifications(userId: number, mediaType: MediaType, mediaId: number) {
        return this.repository.deleteUserMediaNotifications(userId, mediaType, mediaId);
    }

    // --- Both Notifications -----------------------------

    async getLastNotifications(userId: number, type: NotifTab, limit = 8) {
        return this.repository.getLastNotifications(userId, type, limit);
    }

    async countUnreadNotifications(userId: number) {
        return this.repository.countUnreadNotifications(userId);
    }

    async markAllAsRead(userId: number, type: NotifTab) {
        return this.repository.markAllAsRead(userId, type);
    }
}
