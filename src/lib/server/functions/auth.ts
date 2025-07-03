import {eq} from "drizzle-orm";
import {auth} from "@/lib/server/core/auth";
import {createServerFn} from "@tanstack/react-start";
import {ApiProviderType} from "@/lib/server/utils/enums";
import {getWebRequest} from "@tanstack/react-start/server";
import {userMediaSettings} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/async-storage";


export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) return null;

    const settings = await getDbClient()
        .select()
        .from(userMediaSettings)
        .where(eq(userMediaSettings.userId, parseInt(session.user.id)));

    return {
        ...session.user,
        searchSelector: session.user.searchSelector as ApiProviderType,
        settings,
    };
});
