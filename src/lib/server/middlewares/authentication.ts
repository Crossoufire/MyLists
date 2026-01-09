import {RoleType} from "@/lib/utils/enums";
import {auth} from "@/lib/server/core/auth";
import {redirect} from "@tanstack/react-router";
import {createMiddleware} from "@tanstack/react-start";
import {getRequest} from "@tanstack/react-start/server";
import {getContainer} from "@/lib/server/core/container";
import {isAdminAuthenticated} from "@/lib/utils/admin-token";


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


export const adminAuthMiddleware = createMiddleware({ type: "function" })
    .middleware([managerAuthMiddleware])
    .server(async ({ next, context }) => {
        if (await isAdminAuthenticated(context.currentUser.id)) {
            return next();
        }

        throw redirect({ to: "/admin" });
    });
