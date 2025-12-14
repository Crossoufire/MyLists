import {MediaType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {tryNotFound} from "@/lib/utils/try-not-found";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {getUserStatsSchema} from "@/lib/types/zod.schema.types";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {ComponentDataMap, TopItemData} from "@/lib/client/social-card/types";
import {authorizationMiddleware} from "@/lib/server/middlewares/authorization";


export const getUserStats = createServerFn({ method: "GET" })
    .middleware([authorizationMiddleware])
    .inputValidator((data) => tryNotFound(() => getUserStatsSchema.parse(data)))
    .handler(async ({ data: { mediaType }, context: { user } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        const activatedMediaTypes = user.userMediaSettings.filter((s) => s.active).map((s) => s.mediaType)

        if (!mediaType) {
            const userStats = await userStatsService.userAdvancedSummaryStats(user.id);
            return {
                ...userStats,
                activatedMediaTypes,
                mediaType: undefined,
                ratingSystem: user.ratingSystem,
            };
        }

        if (user.userMediaSettings.find((s) => s.mediaType === mediaType)?.active === false) {
            throw new FormattedError("MediaType not activated");
        }

        const mediaStats = await userStatsService.userAdvancedMediaStats(user.id, mediaType);
        return {
            ...mediaStats,
            mediaType,
            activatedMediaTypes,
            ratingSystem: user.ratingSystem,
        };
    });


export const getUserStatsCard = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .inputValidator((data) => {
        console.log({ data });
        return data as { mediaType: MediaType };
    })
    .handler(async ({ data: { mediaType }, context: { currentUser } }) => {
        const userStatsService = await getContainer().then(c => c.services.userStats);
        const mediaStats = await userStatsService.userAdvancedMediaStats(currentUser.id, mediaType);

        let topActor: TopItemData | undefined = { count: 0, name: "-" };
        if ("actorsStats" in mediaStats.specificMediaStats) {
            topActor = {
                count: mediaStats.specificMediaStats.actorsStats.topValues[0].value as number,
                name: mediaStats.specificMediaStats.actorsStats.topValues[0].name,
            }
        }

        let topDirector: TopItemData | undefined = { count: 0, name: "-" };
        if ("directorsStats" in mediaStats.specificMediaStats) {
            topDirector = {
                count: mediaStats.specificMediaStats.directorsStats.topValues[0].value as number,
                name: mediaStats.specificMediaStats.directorsStats.topValues[0].name,
            }
        }

        let topAuthor: TopItemData | undefined = { count: 0, name: "-" };
        if ("authorsStats" in mediaStats.specificMediaStats) {
            topAuthor = {
                count: mediaStats.specificMediaStats.authorsStats.topValues[0].value as number,
                name: mediaStats.specificMediaStats.authorsStats.topValues[0].name,
            }
        }

        let topDeveloper: TopItemData | undefined = { count: 0, name: "-" };
        if ("developersStats" in mediaStats.specificMediaStats) {
            topDeveloper = {
                count: mediaStats.specificMediaStats.developersStats.topValues[0].value as number,
                name: mediaStats.specificMediaStats.developersStats.topValues[0].name,
            }
        }

        let topPlatform: TopItemData | undefined = { count: 0, name: "-" };
        if ("platformsStats" in mediaStats.specificMediaStats) {
            topPlatform = {
                count: mediaStats.specificMediaStats.platformsStats.topValues[0].value as number,
                name: mediaStats.specificMediaStats.platformsStats.topValues[0].name,
            }
        }

        const statsPerComponent: Omit<ComponentDataMap, "featuredMedia" | "mediaShowcase"> = {
            activity: { value: mediaStats.totalUpdates },
            comments: { value: mediaStats.totalComments },
            pagesRead: { value: mediaStats.totalSpecific },
            mediaCount: { value: mediaStats.totalEntries },
            favorites: { value: mediaStats.totalFavorites },
            chaptersRead: { value: mediaStats.totalSpecific },
            episodesWatched: { value: mediaStats.totalSpecific },
            timeSpent: { value: Math.round(mediaStats.timeSpentHours) },
            avgRating: { value: mediaStats.avgRated ? mediaStats.avgRated.toFixed(2) : "" },
            topGenre: {
                count: mediaStats.specificMediaStats.genresStats.topValues[0].value as number,
                name: mediaStats.specificMediaStats.genresStats.topValues[0].name,
            },
            yearInReview: {
                mediaCount: mediaStats.totalEntries,
                favorites: mediaStats.totalFavorites,
                timeSpent: Math.round(mediaStats.timeSpentHours),
                avgRating: mediaStats.avgRated ? mediaStats.avgRated.toFixed(2) : 0,
            },
            topActor,
            topDirector,
            topAuthor,
            topDeveloper,
            topPlatform,
        }

        console.log({ statsPerComponent });

        return statsPerComponent;
    });
