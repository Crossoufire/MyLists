import {auth} from "@/lib/server/core/auth";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {createMiddleware} from "@tanstack/react-start";
import {getRequest} from "@tanstack/react-start/server";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {notFound, redirect} from "@tanstack/react-router";
import {baseUsernameSchema} from "@/lib/types/zod.schema.types";
import {PrivacyType, RoleType, SocialState} from "@/lib/utils/enums";


export const headerMiddleware = createMiddleware({ type: "function" })
    .inputValidator(tryNotFound(baseUsernameSchema))
    .server(async ({ next, data: { username } }) => {
        const container = await getContainer();
        const userService = container.services.user;

        const user = await userService.getUserByUsername(username);
        if (!user) throw notFound();

        const { headers } = getRequest()!;
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
        const currentUser = session?.user ? { ...session.user, id: Number(session.user.id) } : undefined;

        if (!currentUser && user.privacy !== PrivacyType.PUBLIC) {
            throw redirect({ to: "/", search: { authExpired: true } });
        }

        return next({
            context: {
                user,
                currentUser,
            }
        });
    });


export const authorizationMiddleware = createMiddleware({ type: "function" })
    .inputValidator(tryNotFound(baseUsernameSchema))
    .server(async ({ next, data: { username } }) => {
        const container = await getContainer();
        const userService = container.services.user;

        const user = await userService.getUserByUsername(username);
        if (!user) throw notFound();

        const { headers } = getRequest();
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
        const currentUser = session?.user ? { ...session.user, id: Number(session.user.id) } : undefined;

        if (currentUser) {
            await userService.updateUserLastSeen(container.cacheManager, currentUser.id);
        }

        // Guard: Unauthenticated access to non-public profiles
        if (!currentUser && user.privacy !== PrivacyType.PUBLIC) {
            throw redirect({ to: "/", search: { authExpired: true } });
        }

        // Guard: Private profile access requirements
        if (user.privacy === PrivacyType.PRIVATE && currentUser?.id !== user.id && currentUser?.role !== RoleType.ADMIN) {
            const followStatus = await userService.getFollowingStatus(currentUser!.id, user.id);
            if (followStatus?.status !== SocialState.ACCEPTED) {
                throw new FormattedError("Unauthorized");
            }
        }

        return next({
            context: {
                user,
                currentUser,
            },
        });
    });
