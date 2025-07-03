import {auth} from "@/lib/server/core/auth";
import {redirect} from "@tanstack/react-router";
import {RoleType} from "@/lib/server/utils/enums";
import {createMiddleware} from "@tanstack/react-start";
import {getWebRequest} from "@tanstack/react-start/server";


export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session) {
        throw redirect({ to: "/", statusCode: 401, reloadDocument: true, replace: true });
    }

    return next({ context: { currentUser: session.user } });
});


export const managerAuthMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session || !session.user || session.user.role !== RoleType.MANAGER) {
        throw redirect({ to: "/", statusCode: 401, reloadDocument: true, replace: true });
    }

    return next({ context: { currentUser: session.user } });
});
