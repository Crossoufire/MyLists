import {auth} from "@/lib/server/auth";
import {container} from "../container";
import {PrivacyType} from "@/lib/server/utils/enums";
import {createMiddleware} from "@tanstack/react-start";
import {notFound, redirect} from "@tanstack/react-router";
import {getWebRequest} from "@tanstack/react-start/server";


export interface BaseDataWithUsername {
    username: string;
    [key: string]: any;
}


export const authorizationMiddleware = createMiddleware()
    .validator((rawData: any): BaseDataWithUsername => {
        if (typeof rawData !== "object" || rawData === null) {
            throw new Error("Bad request");
        }

        const data = rawData as Record<string, any>;

        if (!data.username) {
            throw notFound();
        }

        return data as BaseDataWithUsername;
    })
    .server(async ({ next, data: { username } }) => {
        const userService = container.services.user;

        const user = await userService.getUserByUsername(username);
        if (!user) {
            throw notFound();
        }

        const { headers } = getWebRequest()!;
        const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
        const isAuthenticated = !!session?.user

        if (!isAuthenticated && user.privacy !== PrivacyType.PUBLIC) {
            throw redirect({ to: "/", reloadDocument: true, replace: true })
        }

        return next({ context: { user: user, currentUser: session?.user } });
    });
