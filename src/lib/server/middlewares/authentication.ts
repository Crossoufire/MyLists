import {auth} from "@/lib/server/core/auth";
import {redirect} from "@tanstack/react-router";
import {RoleType} from "@/lib/server/utils/enums";
import {createMiddleware} from "@tanstack/react-start";
import {getWebRequest} from "@tanstack/react-start/server";
import {updateLastSeen} from "@/lib/server/utils/last-seen";


export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session) {
        throw redirect({ to: "/", search: { authExpired: true }, statusCode: 401 });
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
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session || !session.user || session.user.role !== RoleType.MANAGER) {
        throw redirect({ to: "/", search: { authExpired: true }, statusCode: 401 });
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
