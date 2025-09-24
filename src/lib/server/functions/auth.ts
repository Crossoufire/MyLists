import {eq} from "drizzle-orm";
import {auth} from "@/lib/server/core/auth";
import {createServerFn} from "@tanstack/react-start";
import {getRequest} from "@tanstack/react-start/server";
import {userMediaSettings} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/async-storage";
import {ApiProviderType, PrivacyType, RatingSystemType, RoleType} from "@/lib/utils/enums";


export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
        return null;
    }

    const settings = await getDbClient()
        .select()
        .from(userMediaSettings)
        .where(eq(userMediaSettings.userId, parseInt(session.user.id)));

    return {
        ...session.user,
        id: parseInt(session.user.id),
        role: session.user.role as RoleType,
        privacy: session.user.privacy as PrivacyType,
        ratingSystem: session.user.ratingSystem as RatingSystemType,
        searchSelector: session.user.searchSelector as ApiProviderType,
        settings,
    };
});
