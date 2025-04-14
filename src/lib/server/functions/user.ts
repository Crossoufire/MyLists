import {eq} from "drizzle-orm";
import {auth} from "@/lib/server/auth";
import {db} from "@/lib/server/database/db";
import {createServerFn} from "@tanstack/react-start";
import {ApiProviderType} from "@/lib/server/utils/enums";
import {getWebRequest} from "@tanstack/react-start/server";
import {userMediaSettings} from "@/lib/server/database/schema";


export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getWebRequest()!;
    const session = await auth.api.getSession({ headers });

    if (!session?.user) return null;

    // @ts-expect-error
    const settings = await db.query.userMediaSettings.findMany({ where: eq(userMediaSettings.userId, session.user.id) });

    return {
        ...session.user,
        searchSelector: session.user.searchSelector as ApiProviderType,
        settings,
    };
});
