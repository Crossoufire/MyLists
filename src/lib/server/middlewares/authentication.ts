import {auth} from "@/lib/server/core/auth";
import {redirect} from "@tanstack/react-router";
import {RoleType} from "@/lib/server/utils/enums";
import {createMiddleware} from "@tanstack/react-start";
import {updateLastSeen} from "@/lib/server/utils/last-seen";
import {verifyAdminToken} from "@/lib/server/utils/jwt-utils";
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
