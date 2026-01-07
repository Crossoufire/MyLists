import {auth} from "@/lib/server/core/auth";
import {PrivacyType} from "@/lib/utils/enums";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {createMiddleware} from "@tanstack/react-start";
import {getRequest} from "@tanstack/react-start/server";
import {getContainer} from "@/lib/server/core/container";
import {notFound, redirect} from "@tanstack/react-router";
import {baseUsernameSchema} from "@/lib/types/zod.schema.types";


export const authorizationMiddleware = createMiddleware({ type: "function" })
    .inputValidator(tryNotFound(baseUsernameSchema))
    .server(async ({ next, data: { username } }) => {
        const container = await getContainer();

        const userService = container.services.user;
        const user = await userService.getUserByUsername(username);

        if (!user) {
            throw notFound();
        }

        const { headers } = getRequest()!;
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
        const isAuthenticated = !!session?.user

        if (!isAuthenticated && user.privacy !== PrivacyType.PUBLIC) {
            throw redirect({ to: "/", search: { authExpired: true } });
        }

        if (session?.user) {
            await userService.updateUserLastSeen(container.cacheManager, Number(session.user.id));
        }

        return next({
            context: {
                user: user,
                currentUser: session?.user ? { ...session.user, id: Number(session.user.id) } : undefined,
            }
        });
    });
