import {MediaType, NotificationType} from "@/lib/server/utils/enums";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";


export class NotificationsService {
    constructor(private repository: typeof NotificationsRepository) {
    }

    async sendMediaNotifications(mediaType: MediaType, mediaArray: any[]) {
        for (const userMedia of mediaArray) {
            const notification = await this.repository.searchNotification(userMedia.userId, mediaType, userMedia.id);
            if (notification) {
                continue;
            }
            
            await this.repository.addNotification({
                mediaType: mediaType,
                mediaId: userMedia.id,
                userId: userMedia.userId,
                notificationType: NotificationType.MEDIA,
                payload: { name: userMedia.name, releaseDate: userMedia.releaseDate },
            });
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
