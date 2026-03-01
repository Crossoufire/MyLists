import {auth} from "@/lib/server/core/auth";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {createMiddleware} from "@tanstack/react-start";
import {getRequest} from "@tanstack/react-start/server";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {notFound, redirect} from "@tanstack/react-router";
import {baseUsernameSchema} from "@/lib/types/zod.schema.types";
import {PrivacyType, RoleType, SocialState} from "@/lib/utils/enums";


export const optionalAuthMiddleware = createMiddleware({ type: "function" })
    .server(async ({ next }) => {
        const { headers } = getRequest();
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

        const currentUser = session?.user ? { ...session.user, id: Number(session.user.id) } : undefined;
        if (currentUser) {
            void getContainer()
                .then((c) => c.services.user.updateUserLastSeen(c.cacheManager, currentUser.id))
                .catch()
        }

        return next({ context: { currentUser } });
    });


export const resolveTargetUserMiddleware = createMiddleware({ type: "function" })
    .middleware([optionalAuthMiddleware])
    .inputValidator(tryNotFound(baseUsernameSchema))
    .server(async ({ next, data: { username }, context: { currentUser } }) => {
        const container = await getContainer();
        const userService = container.services.user;

        const targetUser = await userService.getUserByUsername(username);
        if (!targetUser) throw notFound();

        // Guard non-authed access to non-public pages
        if (!currentUser && targetUser.privacy !== PrivacyType.PUBLIC) {
            throw redirect({ to: "/", search: { authExpired: true } });
        }

        return next({
            context: {
                targetUser,
                currentUser,
            }
        });
    });


export const privateAuthZMiddleware = createMiddleware({ type: "function" })
    .middleware([resolveTargetUserMiddleware])
    .server(async ({ next, context: { targetUser, currentUser } }) => {
        const container = await getContainer();
        const userService = container.services.user;

        // Guard private pages access requirements
        if (targetUser.privacy === PrivacyType.PRIVATE && currentUser?.id !== targetUser.id && currentUser?.role !== RoleType.ADMIN) {
            const followStatus = await userService.getFollowingStatus(currentUser!.id, targetUser.id);
            if (followStatus?.status !== SocialState.ACCEPTED) {
                throw new FormattedError("Unauthorized");
            }
        }

        return next({
            context: {
                currentUser,
                user: targetUser,
            },
        });
    });
