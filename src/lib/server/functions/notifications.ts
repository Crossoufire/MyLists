import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getNotifications = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer();
        const userService = container.services.user;
        const notificationsService = container.services.notifications;

        await userService.updateNotificationsReadTime(currentUser.id);
        return notificationsService.getLastNotifications(currentUser.id);
    });


export const getNotificationsCount = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const container = await getContainer();
        const notificationsService = container.services.notifications;
        return notificationsService.countUnreadNotifications(currentUser.id, currentUser.lastNotifReadTime);
    });
