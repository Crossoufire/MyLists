import {auth} from "@/lib/server/auth";
import {container} from "../container";
import {createMiddleware} from "@tanstack/react-start";
import {notFound, redirect} from "@tanstack/react-router";
import {getWebRequest} from "@tanstack/react-start/server";


export const authorizationMiddleware = createMiddleware()
    .server(async ({ next, data }) => {
        const userService = container.services.user;

        if (!data) throw notFound();

        const user = await userService.getUserByUsername(data as string);
        if (!user) throw notFound()

        const { headers } = getWebRequest()!;
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
        const isAuthenticated = !!session?.user

        if (!isAuthenticated && user.privacy !== Privacy.PUBLIC) {
            throw redirect({ to: "/", reloadDocument: true, replace: true })
        }

        return next({
            context: {
                user: user,
                userService,
                currentUser: session?.user,
            }
        });
    });
