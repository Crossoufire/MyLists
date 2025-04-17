import {db} from "@/lib/server/database/db";
import {and, count, desc, eq, sql} from "drizzle-orm";
import {NotificationType} from "@/lib/server/utils/enums";
import {notifications} from "@/lib/server/database/schema";


export class NotificationsRepository {
    static async sendNotification(userId: number, notificationType: NotificationType, payload: Record<string, any>) {
        await db.insert(notifications).values({ userId, notificationType, payload });
    }

    static async getLastNotifications(userId: number, limit = 8) {
        return db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.timestamp))
            .limit(limit)
            .execute();
    }

    static async countUnreadNotifications(userId: number, lastReadTime: string | null) {
        const lastNotifReadTime = lastReadTime ? lastReadTime : new Date(1900, 0, 1);

        const notificationsCount = await db
            .select({ count: count() })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), sql`${notifications.timestamp} >= ${lastNotifReadTime}`))
            .get();
        
        return notificationsCount?.count || 0;
    }
}
