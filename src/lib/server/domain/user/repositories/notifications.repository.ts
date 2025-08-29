import {notifications} from "@/lib/server/database/schema";
import {and, count, desc, eq, inArray, sql} from "drizzle-orm";
import {getDbClient} from "@/lib/server/database/async-storage";
import {MediaType, NotificationType} from "@/lib/server/utils/enums";
import {UpdateMediaNotification} from "@/lib/types/base.types";


export class NotificationsRepository {
    static async sendNotification(userId: number, notificationType: NotificationType, payload: Record<string, any>) {
        await getDbClient()
            .insert(notifications)
            .values({ userId, notificationType, payload });
    }

    static async addNotification(updateData: UpdateMediaNotification) {
        await getDbClient()
            .insert(notifications)
            .values(updateData);
    }

    static async searchNotification(userId: number, mediaType: MediaType, mediaId: number) {
        return getDbClient()
            .select()
            .from(notifications)
            .where(and(eq(notifications.userId, userId), eq(notifications.mediaType, mediaType), eq(notifications.mediaId, mediaId)))
            .orderBy(desc(notifications.timestamp))
            .get();
    }

    static async getLastNotifications(userId: number, limit = 8) {
        return getDbClient()
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.timestamp))
            .limit(limit)
            .execute();
    }

    static async countUnreadNotifications(userId: number, lastReadTime: Date | null) {
        const lastNotifReadTime = lastReadTime ? lastReadTime : new Date(1900, 0, 1);

        const notificationsCount = await getDbClient()
            .select({ count: count() })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), sql`${notifications.timestamp} >= ${lastNotifReadTime}`))
            .get();

        return notificationsCount?.count || 0;
    }

    static async deleteNotifications(mediaType: MediaType, mediaIds: number[]) {
        await getDbClient()
            .delete(notifications)
            .where(and(eq(notifications.mediaType, mediaType), inArray(notifications.mediaId, mediaIds)))
            .execute();
    }

    static async deleteUserMediaNotifications(userId: number, mediaType: MediaType, mediaId: number) {
        await getDbClient()
            .delete(notifications)
            .where(and(
                eq(notifications.userId, userId),
                eq(notifications.mediaId, mediaId),
                eq(notifications.mediaType, mediaType),
            ))
            .execute();
    }
}
