import {auth} from "@/lib/server/core/auth";
import {PrivacyType} from "@/lib/server/utils/enums";
import {createMiddleware} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {notFound, redirect} from "@tanstack/react-router";
import {getWebRequest} from "@tanstack/react-start/server";
import {updateLastSeen} from "@/lib/server/utils/last-seen";
import {tryNotFound} from "@/lib/server/utils/try-not-found";

import {baseUsernameSchema} from "@/lib/types/zod.schema.types";


export const authorizationMiddleware = createMiddleware({ type: "function" })
    .validator(data => tryNotFound(() => baseUsernameSchema.parse(data)))
    .server(async ({ next, data: { username } }) => {
        const userService = await getContainer().then(c => c.services.user);

        const user = await userService.getUserByUsername(username);
        if (!user) throw notFound();

        const { headers } = getWebRequest()!;
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
        const isAuthenticated = !!session?.user

        if (!isAuthenticated && user.privacy !== PrivacyType.PUBLIC) {
            throw redirect({ to: "/", search: { authExpired: true } });
        }

        if (session?.user) {
            await updateLastSeen(session.user.name);
        }

        return next({
            context: {
                user: user,
                currentUser: session?.user ? { ...session.user, id: parseInt(session.user.id) } : undefined,
            }
        });
    });
