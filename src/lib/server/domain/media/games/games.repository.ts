import {db} from "@/lib/server/database/db";
import {notFound} from "@tanstack/react-router";
import {JobType, Status} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/async-storage";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {gamesConfig, GamesSchemaConfig} from "@/lib/server/domain/media/games/games.config";
import {games, gamesCompanies, gamesGenre, gamesList, gamesPlatforms} from "@/lib/server/database/schema";
import {and, asc, count, countDistinct, eq, getTableColumns, gte, isNotNull, isNull, like, lte, notInArray, or, sql} from "drizzle-orm";


export class GamesRepository extends BaseRepository<GamesSchemaConfig> {
    config: GamesSchemaConfig;

    constructor() {
        super(gamesConfig);
        this.config = gamesConfig;
    }

    async getComingNext(userId: number) {
        const comingNext = await getDbClient()
            .select({
                mediaId: games.id,
                mediaName: games.name,
                date: games.releaseDate,
                imageCover: games.imageCover,
            })
            .from(games)
            .innerJoin(gamesList, eq(gamesList.mediaId, games.id))
            .where(and(
                eq(gamesList.userId, userId),
                notInArray(gamesList.status, [Status.DROPPED]),
                gte(games.releaseDate, sql`CURRENT_TIMESTAMP`),
            ))
            .orderBy(asc(games.releaseDate))
            .execute();

        return comingNext;
    }

    async computeAllUsersStats() {
        const results = await getDbClient()
            .select({
                userId: gamesList.userId,
                timeSpent: sql<number>`COALESCE(SUM(${gamesList.playtime}), 0)`.as("timeSpent"),
                totalSpecific: sql<number>`0`.as("totalSpecific"),
                statusCounts: sql`
                    COALESCE((
                        SELECT 
                            JSON_GROUP_OBJECT(status, count_per_status) 
                        FROM (
                            SELECT 
                                status,
                                COUNT(*) as count_per_status 
                            FROM ${gamesList} as sub_list 
                            WHERE sub_list.user_id = ${gamesList.userId} GROUP BY status
                        )
                    ), '{}')
                `.as("statusCounts"),
                entriesFavorites: sql<number>`
                    COALESCE(SUM(CASE WHEN ${gamesList.favorite} = 1 THEN 1 ELSE 0 END), 0)
                `.as("entriesFavorites"),
                totalRedo: sql<number>`0`.as("totalRedo"),
                entriesCommented: sql<number>`
                    COALESCE(SUM(CASE WHEN LENGTH(TRIM(COALESCE(${gamesList.comment}, ''))) > 0 THEN 1 ELSE 0 END), 0)
                `.as("entriesCommented"),
                totalEntries: count(gamesList.mediaId).as("totalEntries"),
                entriesRated: count(gamesList.rating).as("entriesRated"),
                sumEntriesRated: sql<number>`COALESCE(SUM(${gamesList.rating}), 0)`.as("sumEntriesRated"),
                averageRating: sql<number>`
                    COALESCE(SUM(${gamesList.rating}) * 1.0 / NULLIF(COUNT(${gamesList.rating}), 0), 0.0)
                `.as("averageRating"),
            })
            .from(gamesList)
            .innerJoin(games, eq(gamesList.mediaId, games.id))
            .groupBy(gamesList.userId)
            .execute();

        return results.map((row) => {
            let statusCounts: Record<string, number> = {};
            try {
                const parsed = typeof row.statusCounts === "string" ? JSON.parse(row.statusCounts) : row.statusCounts;
                if (typeof parsed === "object" && parsed !== null) {
                    statusCounts = parsed;
                }
            }
            catch (e) {
                console.error(`Failed to parse statusCounts for user ${row.userId}:`, row.statusCounts, e);
            }

            return {
                userId: row.userId,
                statusCounts: statusCounts,
                timeSpent: Number(row.timeSpent) || 0,
                totalRedo: Number(row.totalRedo) || 0,
                totalEntries: Number(row.totalEntries) || 0,
                entriesRated: Number(row.entriesRated) || 0,
                totalSpecific: Number(row.totalSpecific) || 0,
                averageRating: Number(row.averageRating) || 0,
                sumEntriesRated: Number(row.sumEntriesRated) || 0,
                entriesFavorites: Number(row.entriesFavorites) || 0,
                entriesCommented: Number(row.entriesCommented) || 0,
            };
        });
    }

    async getMediaToNotify() {
        return getDbClient()
            .select({
                ...getTableColumns(games),
                mediaList: { ...getTableColumns(gamesList) },
            })
            .from(games)
            .innerJoin(gamesList, eq(gamesList.mediaId, games.id))
            .where(and(
                isNotNull(games.releaseDate),
                gte(games.releaseDate, sql`datetime('now')`),
                lte(games.releaseDate, sql`datetime('now', '+7 days')`),
            ))
            .orderBy(games.releaseDate)
            .execute();
    }

    async addMediaToUserList(userId: number, mediaId: number, newStatus: Status) {
        const [newMedia] = await getDbClient()
            .insert(gamesList)
            .values({ userId, mediaId, status: newStatus, playtime: 0 })
            .returning();

        return newMedia;
    }

    async getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit = 25) {
        let dataQuery = getDbClient()
            .selectDistinct({
                mediaId: games.id,
                mediaName: games.name,
                imageCover: games.imageCover,
                inUserList: isNotNull(gamesList.userId).mapWith(Boolean).as("inUserList"),
            })
            .from(games)
            .leftJoin(gamesList, and(eq(gamesList.mediaId, games.id), eq(gamesList.userId, userId)))
            .$dynamic();

        let countQuery = getDbClient()
            .select({ value: countDistinct(games.id) })
            .from(games)
            .$dynamic();

        let filterConditions: any[] = [];
        if (job === JobType.CREATOR) {
            dataQuery = dataQuery.innerJoin(gamesCompanies, eq(gamesCompanies.mediaId, games.id));
            countQuery = countQuery.innerJoin(gamesCompanies, eq(gamesCompanies.mediaId, games.id));
            filterConditions = [like(gamesCompanies.name, `%${name}%`), eq(gamesCompanies.developer, true)];
        }
        else {
            throw notFound();
        }

        if (filterConditions.length > 0) {
            dataQuery = dataQuery.where(and(...filterConditions));
            countQuery = countQuery.where(and(...filterConditions));
        }

        const [totalResult, results] = await Promise.all([
            countQuery.execute(),
            dataQuery.orderBy(asc(games.releaseDate)).limit(limit).offset(offset).execute(),
        ]);

        const totalCount = totalResult[0]?.value ?? 0;

        return { items: results, total: totalCount, pages: Math.ceil(totalCount / limit) };
    }

    async getMediaToBeRefreshed() {
        return getDbClient()
            .select({ apiId: games.apiId })
            .from(games)
            .where(and(
                lte(games.lastApiUpdate, sql`datetime(CURRENT_TIMESTAMP, '-6 days')`),
                or(gte(games.releaseDate, sql`CURRENT_TIMESTAMP`), isNull(games.releaseDate))
            ));
    }

    async findAllAssociatedDetails(mediaId: number) {
        const mainData = await getDbClient().query.games.findFirst({
            where: eq(games.id, mediaId),
            with: {
                gamesGenres: true,
                gamesCompanies: true,
                gamesPlatforms: true,
            },
        });

        if (!mainData) {
            throw new Error("Game not found");
        }

        return { ...mainData };
    }

    async storeMediaWithDetails({ mediaData, companiesData, platformsData, genresData }: any) {
        const result = await db.transaction(async (tx) => {
            const [media] = await tx
                .insert(games)
                .values(mediaData)
                .returning()

            if (!media) {
                throw new Error("Failed to store the media details");
            }

            const mediaId = media.id;

            if (companiesData && companiesData.length > 0) {
                const companiesToAdd = companiesData.map((comp: any) => ({ mediaId, name: comp.name }));
                await tx.insert(gamesCompanies).values(companiesToAdd)
            }
            if (platformsData && platformsData.length > 0) {
                const platformsToAdd = platformsData.map((plt: any) => ({ mediaId, name: plt.name }));
                await tx.insert(gamesPlatforms).values(platformsToAdd)
            }
            if (genresData && genresData.length > 0) {
                const genresToAdd = genresData.map((genre: any) => ({ mediaId, name: genre.name }));
                await tx.insert(gamesGenre).values(genresToAdd)
            }

            return mediaId;
        });

        return result
    }

    async updateMediaWithDetails({ mediaData, companiesData, platformsData, genresData }: any) {
        const tx = getDbClient();

        const [media] = await tx
            .update(games)
            .set({ ...mediaData, lastApiUpdate: sql`CURRENT_TIMESTAMP` })
            .where(eq(games.apiId, mediaData.apiId))
            .returning({ id: games.id })

        const mediaId = media.id;

        if (companiesData && companiesData.length > 0) {
            await tx.delete(gamesCompanies).where(eq(gamesCompanies.mediaId, mediaId));
            const companiesToAdd = companiesData.map((company: any) => ({ mediaId, ...company }));
            await tx.insert(gamesCompanies).values(companiesToAdd)
        }
        if (platformsData && platformsData.length > 0) {
            await tx.delete(gamesPlatforms).where(eq(gamesPlatforms.mediaId, mediaId));
            const platformsToAdd = platformsData.map((platform: any) => ({ mediaId, name: platform.name }));
            await tx.insert(gamesPlatforms).values(platformsToAdd)
        }
        if (genresData && genresData.length > 0) {
            await tx.delete(gamesGenre).where(eq(gamesGenre.mediaId, mediaId));
            const genresToAdd = genresData.map((genre: any) => ({ mediaId, name: genre.name }));
            await tx.insert(gamesGenre).values(genresToAdd)
        }

        return true;
    }

    async getListFilters(userId: number) {
        const { genres, labels } = await super.getCommonListFilters(userId);

        const platforms = await getDbClient()
            .selectDistinct({ name: gamesList.platform })
            .from(gamesList)
            .where(and(eq(gamesList.userId, userId), isNotNull(gamesList.platform)));

        return { platforms, genres, labels };
    }

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        if (job === JobType.CREATOR) {
            const companies = await getDbClient()
                .selectDistinct({ name: gamesCompanies.name })
                .from(gamesCompanies)
                .innerJoin(gamesList, eq(gamesList.mediaId, gamesCompanies.mediaId))
                .where(and(eq(gamesList.userId, userId), like(gamesCompanies.name, `%${query}%`)));
            return companies
        }
        else {
            throw notFound();
        }
    }

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: Record<string, any>) {
        const [result] = await getDbClient()
            .update(gamesList)
            .set(updateData)
            .where(and(eq(gamesList.userId, userId), eq(gamesList.mediaId, mediaId)))
            .returning();

        return result;
    }

    // --- Achievements ----------------------------------------------------------
    //
    // getDurationAchievementCte(achievement: Achievement, userId?: number) {
    //     const value = parseInt(achievement.value!);
    //     const isLong = achievement.codeName.includes("long");
    //     const condition = isLong ? gte(games.duration, value) : lte(games.duration, value);
    //
    //     let baseCTE = getDbClient()
    //         .select({
    //             userId: gamesList.userId,
    //             value: count(gamesList.mediaId).as("value"),
    //         }).from(gamesList)
    //         .innerJoin(games, eq(gamesList.mediaId, games.id))
    //
    //     const conditions = [eq(gamesList.status, Status.COMPLETED), condition]
    //
    //     return this.applyUserFilterAndGrouping(baseCTE, conditions, userId);
    // }
    //
    // getDirectorAchievementCte(_achievement: Achievement, userId?: number) {
    //     let subQ = getDbClient()
    //         .select({
    //             userId: gamesList.userId,
    //             count: count(gamesList.mediaId).as("count"),
    //         }).from(gamesList)
    //         .innerJoin(games, eq(gamesList.mediaId, games.id))
    //         .where(eq(gamesList.status, Status.COMPLETED))
    //         .groupBy(userId ? eq(gamesList.userId, userId) : gamesList.userId, games.directorName)
    //         .as("sub");
    //
    //     return getDbClient()
    //         .select({
    //             userId: subQ.userId,
    //             value: max(subQ.count).as("value"),
    //         }).from(subQ)
    //         .groupBy(subQ.userId)
    //         .as("calculation");
    // }
    //
    // getActorAchievementCte(_achievement: Achievement, userId?: number) {
    //     let subQ = getDbClient()
    //         .select({
    //             userId: gamesList.userId,
    //             count: count(gamesList.mediaId).as("count"),
    //         }).from(gamesList)
    //         .innerJoin(gamesActors, eq(gamesList.mediaId, gamesActors.mediaId))
    //         .where(eq(gamesList.status, Status.COMPLETED))
    //         .groupBy(userId ? eq(gamesList.userId, userId) : gamesList.userId, gamesActors.name)
    //         .as("sub");
    //
    //     return getDbClient()
    //         .select({
    //             userId: subQ.userId,
    //             value: max(subQ.count).as("value"),
    //         }).from(subQ)
    //         .groupBy(subQ.userId)
    //         .as("calculation");
    // }
    //
    // getOriginLanguageAchievementCte(_achievement: Achievement, userId?: number) {
    //     let baseCTE = getDbClient()
    //         .select({
    //             userId: gamesList.userId,
    //             value: countDistinct(games.originalLanguage).as("value"),
    //         }).from(gamesList)
    //         .innerJoin(games, eq(gamesList.mediaId, games.id))
    //
    //     const conditions = [eq(gamesList.status, Status.COMPLETED)]
    //
    //     return this.applyUserFilterAndGrouping(baseCTE, conditions, userId);
    // }
    //
    // // --- Advanced Stats  --------------------------------------------------
    //
    // async avgMovieDuration(userId?: number) {
    //     const forUser = userId ? eq(gamesList.userId, userId) : undefined;
    //
    //     const avgDuration = await getDbClient()
    //         .select({
    //             average: sql<number | null>`cast(avg(${games.duration}) as numeric)`.as("avg_duration")
    //         })
    //         .from(games)
    //         .innerJoin(gamesList, eq(gamesList.mediaId, games.id))
    //         .where(and(forUser, ne(gamesList.status, Status.PLAN_TO_WATCH), isNotNull(games.duration)))
    //         .get();
    //
    //     return avgDuration?.average;
    // }
    //
    // async movieDurationDistrib(userId?: number) {
    //     const forUser = userId ? eq(gamesList.userId, userId) : undefined;
    //
    //     return getDbClient()
    //         .select({
    //             name: sql<number>`floor(${games.duration} / 30.0) * 30`,
    //             value: sql<number>`cast(count(${games.id}) as int)`.as("count"),
    //         })
    //         .from(games)
    //         .innerJoin(gamesList, eq(gamesList.mediaId, games.id))
    //         .where(and(forUser, ne(gamesList.status, Status.PLAN_TO_WATCH), isNotNull(games.duration)))
    //         .groupBy(sql<number>`floor(${games.duration} / 30.0) * 30`)
    //         .orderBy(asc(sql<number>`floor(${games.duration} / 30.0) * 30`));
    // }
    //
    // async budgetRevenueStats(userId?: number) {
    //     const forUser = userId ? eq(gamesList.userId, userId) : undefined;
    //
    //     const data = await getDbClient()
    //         .select({
    //             totalBudget: sql<number>`coalesce(sum(${games.budget}), 0)`.as("total_budget"),
    //             totalRevenue: sql<number>`coalesce(sum(${games.revenue}), 0)`.as("total_revenue"),
    //         })
    //         .from(games)
    //         .innerJoin(gamesList, eq(gamesList.mediaId, games.id))
    //         .where(and(forUser, ne(gamesList.status, Status.PLAN_TO_WATCH)))
    //         .get();
    //
    //     return { totalBudget: data?.totalBudget, totalRevenue: data?.totalRevenue };
    // }
    //
    // async specificTopMetrics(userId?: number) {
    //     const directorsConfig = {
    //         metricTable: games,
    //         metricNameColumn: games.directorName,
    //         metricIdColumn: games.id,
    //         mediaLinkColumn: gamesList.mediaId,
    //         statusFilters: [Status.PLAN_TO_WATCH],
    //     };
    //     const languagesConfig = {
    //         metricTable: games,
    //         metricNameColumn: games.originalLanguage,
    //         metricIdColumn: games.id,
    //         mediaLinkColumn: gamesList.mediaId,
    //         statusFilters: [Status.PLAN_TO_WATCH],
    //     };
    //     const actorsConfig = {
    //         metricTable: gamesActors,
    //         metricNameColumn: gamesActors.name,
    //         metricIdColumn: gamesActors.mediaId,
    //         mediaLinkColumn: gamesList.mediaId,
    //         statusFilters: [Status.PLAN_TO_WATCH],
    //     };
    //
    //     const actorsStats = await this.computeTopMetricStats(actorsConfig, userId);
    //     const languagesStats = await this.computeTopMetricStats(languagesConfig, userId);
    //     const directorsStats = await this.computeTopMetricStats(directorsConfig, userId);
    //
    //     return { directorsStats, actorsStats, languagesStats };
    // }
}
