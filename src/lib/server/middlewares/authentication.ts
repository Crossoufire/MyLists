import {RoleType} from "@/lib/utils/enums";
import {auth} from "@/lib/server/core/auth";
import {redirect} from "@tanstack/react-router";
import {createMiddleware} from "@tanstack/react-start";
import {verifyAdminToken} from "@/lib/utils/jwt-utils";
import {getContainer} from "@/lib/server/core/container";
import {getCookie, getRequest} from "@tanstack/react-start/server";


export const ADMIN_COOKIE_NAME = "myListsAdminToken";


export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session) {
        throw redirect({ to: "/", search: { authExpired: true } });
    }

    const container = await getContainer();
    const userService = container.services.user;
    await userService.updateUserLastSeen(container.cacheManager, Number(session.user.id));

    return next({
        context: {
            currentUser: {
                ...session.user,
                id: Number(session.user.id),
            }
        }
    });
});


export const managerAuthMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session || !session.user || session.user.role !== RoleType.MANAGER) {
        throw redirect({ to: "/", search: { authExpired: true } });
    }

    const container = await getContainer();
    const userService = container.services.user;
    await userService.updateUserLastSeen(container.cacheManager, Number(session.user.id));

    return next({
        context: {
            currentUser: {
                ...session.user,
                id: Number(session.user.id),
            }
        }
    });
});


export const adminAuthMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const adminToken = getCookie(ADMIN_COOKIE_NAME);

    if (!adminToken || !verifyAdminToken(adminToken)) {
        throw redirect({ to: "/admin" });
    }

    return next();
});
