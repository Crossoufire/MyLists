import {MediaType, NotificationType} from "@/lib/server/utils/enums";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";


export class NotificationsService {
    constructor(private repository: typeof NotificationsRepository) {
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
