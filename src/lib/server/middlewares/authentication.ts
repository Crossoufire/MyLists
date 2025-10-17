import {RoleType} from "@/lib/utils/enums";
import {auth} from "@/lib/server/core/auth";
import {redirect} from "@tanstack/react-router";
import {updateLastSeen} from "@/lib/utils/last-seen";
import {createMiddleware} from "@tanstack/react-start";
import {verifyAdminToken} from "@/lib/utils/jwt-utils";
import {getCookie, getRequest} from "@tanstack/react-start/server";


export const ADMIN_COOKIE_NAME = "myListsAdminToken";


export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session) {
        throw redirect({ to: "/", search: { authExpired: true } });
    }

    await updateLastSeen(session.user.name);

    return next({
        context: {
            currentUser: {
                ...session.user,
                id: parseInt(session.user.id),
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

    await updateLastSeen(session.user.name);

    return next({
        context: {
            currentUser: {
                ...session.user,
                id: parseInt(session.user.id),
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
