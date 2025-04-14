import {NotificationType} from "@/lib/server/utils/enums";
import {NotificationsRepository} from "@/lib/server/domain/user/repositories/notifications.repository";


export class NotificationsService {
    constructor(private repository: typeof NotificationsRepository) {
    }

    async sendNotification(userId: number, notificationType: NotificationType, payload: Record<string, any>) {
        return this.repository.sendNotification(userId, notificationType, payload);
    }
}
