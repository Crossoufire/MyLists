import {auth} from "@/lib/server/auth";
import {createServerFn} from "@tanstack/react-start";
import {getWebRequest} from "@tanstack/react-start/server";


export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getWebRequest()!;
    const session = await auth.api.getSession({ headers });

    return session?.user || null;
});
