import {auth} from "@/lib/server/auth";
import {createMiddleware} from "@tanstack/react-start";
import {getWebRequest, setResponseStatus} from "@tanstack/react-start/server";


export const authMiddleware = createMiddleware().server(async ({ next }) => {
    const { headers } = getWebRequest()!;
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });

    if (!session) {
        setResponseStatus(401);
        throw new Error("Unauthorized");
    }

    return next({ context: { user: session.user } });
});
