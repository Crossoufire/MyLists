import {db} from "@/lib/server/database/db";
import {NotificationType} from "@/lib/server/utils/enums";
import {notifications} from "@/lib/server/database/schema";


export class NotificationsRepository {
    static async sendNotification(userId: number, notificationType: NotificationType, payload: Record<string, any>) {
        await db.insert(notifications).values({ userId, notificationType, payload });
    }
}
