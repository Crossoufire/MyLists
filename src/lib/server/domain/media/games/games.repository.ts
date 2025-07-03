import {db} from "@/lib/server/database/db";
import {notFound} from "@tanstack/react-router";
import {getDbClient} from "@/lib/server/database/async-storage";
import {Achievement} from "@/lib/server/types/achievements.types";
import {IGamesRepository} from "@/lib/server/types/repositories.types";
import {GamesPlatformsEnum, JobType, Status} from "@/lib/server/utils/enums";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {AddedMediaDetails, ConfigTopMetric} from "@/lib/server/types/base.types";
import {gamesConfig, GamesSchemaConfig} from "@/lib/server/domain/media/games/games.config";
import {Game, GamesList, UpsertGameWithDetails} from "@/lib/server/domain/media/games/games.types";
import {games, gamesCompanies, gamesGenre, gamesList, gamesPlatforms} from "@/lib/server/database/schema";
import {and, asc, count, countDistinct, eq, getTableColumns, gte, ilike, inArray, isNotNull, isNull, like, lte, max, ne, notInArray, or, sql} from "drizzle-orm";


export class GamesRepository extends BaseRepository<Game, GamesList, GamesSchemaConfig> implements IGamesRepository {
    config: GamesSchemaConfig;

    constructor() {
        super(gamesConfig);
        this.config = gamesConfig;
    }

    async getComingNext(userId: number) {
        return getDbClient()
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
                mediaId: games.id,
                mediaName: games.name,
                releaseDate: games.releaseDate,
                userId: gamesList.userId,
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

    async addMediaToUserList(userId: number, media: any, newStatus: Status) {
        const [newMedia] = await getDbClient()
            .insert(gamesList)
            .values({ userId, mediaId: media.id, status: newStatus, playtime: 0 })
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

    async getMediaIdsToBeRefreshed() {
        const results = await getDbClient()
            .select({ apiId: games.apiId })
            .from(games)
            .where(and(
                lte(games.lastApiUpdate, sql`datetime(CURRENT_TIMESTAMP, '-6 days')`),
                or(gte(games.releaseDate, sql`CURRENT_TIMESTAMP`), isNull(games.releaseDate))
            ));

        return results.map((r) => r.apiId);
    }

    async findAllAssociatedDetails(mediaId: number) {
        const details = await getDbClient()
            .select({
                ...getTableColumns(games),
                genres: sql`json_group_array(DISTINCT json_object('id', ${gamesGenre.id}, 'name', ${gamesGenre.name}))`.mapWith(JSON.parse),
                companies: sql`json_group_array(DISTINCT json_object('id', ${gamesCompanies.id}, 'name', ${gamesCompanies.name}, 'developer', ${gamesCompanies.developer}, 'publisher', ${gamesCompanies.publisher}))`.mapWith(JSON.parse),
                platforms: sql`json_group_array(DISTINCT json_object('id', ${gamesPlatforms.id}, 'name', ${gamesPlatforms.name}))`.mapWith(JSON.parse),
            })
            .from(games)
            .innerJoin(gamesCompanies, eq(gamesCompanies.mediaId, games.id))
            .innerJoin(gamesPlatforms, eq(gamesPlatforms.mediaId, games.id))
            .innerJoin(gamesGenre, eq(gamesGenre.mediaId, games.id))
            .where(eq(games.id, mediaId))
            .groupBy(...Object.values(getTableColumns(games)))
            .get();

        if (!details) return;

        const result: Game & AddedMediaDetails = {
            ...details,
            genres: details.genres || [],
            companies: details.companies || [],
            platforms: details.platforms || [],
        };

        return result;
    }

    async storeMediaWithDetails({ mediaData, companiesData, platformsData, genresData }: UpsertGameWithDetails) {
        const result = await db.transaction(async (tx) => {
            const [media] = await tx
                .insert(games)
                .values(mediaData)
                .returning()

            if (!media) return;

            const mediaId = media.id;
            if (companiesData && companiesData.length > 0) {
                const companiesToAdd = companiesData.map((comp) => ({ mediaId, ...comp }));
                await tx.insert(gamesCompanies).values(companiesToAdd)
            }
            if (platformsData && platformsData.length > 0) {
                const platformsToAdd = platformsData.map((plt) => ({ mediaId, name: plt.name }));
                await tx.insert(gamesPlatforms).values(platformsToAdd)
            }
            if (genresData && genresData.length > 0) {
                const genresToAdd = genresData.map((g) => ({ mediaId, name: g.name }));
                await tx.insert(gamesGenre).values(genresToAdd)
            }

            return mediaId;
        });

        return result;
    }

    async updateMediaWithDetails({ mediaData, companiesData, platformsData, genresData }: UpsertGameWithDetails) {
        const tx = getDbClient();

        const [media] = await tx
            .update(games)
            .set({ ...mediaData, lastApiUpdate: sql`CURRENT_TIMESTAMP` })
            .where(eq(games.apiId, mediaData.apiId))
            .returning({ id: games.id })

        const mediaId = media.id;
        if (companiesData && companiesData.length > 0) {
            await tx.delete(gamesCompanies).where(eq(gamesCompanies.mediaId, mediaId));
            const companiesToAdd = companiesData.map((comp) => ({ mediaId, ...comp }));
            await tx.insert(gamesCompanies).values(companiesToAdd)
        }
        if (platformsData && platformsData.length > 0) {
            await tx.delete(gamesPlatforms).where(eq(gamesPlatforms.mediaId, mediaId));
            const platformsToAdd = platformsData.map((plt) => ({ mediaId, name: plt.name }));
            await tx.insert(gamesPlatforms).values(platformsToAdd)
        }
        if (genresData && genresData.length > 0) {
            await tx.delete(gamesGenre).where(eq(gamesGenre.mediaId, mediaId));
            const genresToAdd = genresData.map((g) => ({ mediaId, name: g.name }));
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

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: Partial<GamesList>) {
        const [result] = await getDbClient()
            .update(gamesList)
            .set(updateData)
            .where(and(eq(gamesList.userId, userId), eq(gamesList.mediaId, mediaId)))
            .returning();

        return result;
    }

    // --- Achievements ----------------------------------------------------------

    getGameModeAchievementCte(achievement: Achievement, userId?: number) {
        let baseCTE = getDbClient()
            .select({
                userId: gamesList.userId,
                value: count(gamesList.id).as("value"),
            }).from(gamesList)
            .innerJoin(games, eq(gamesList.mediaId, games.id))

        const conditions = [
            ilike(games.gameModes, `%${achievement.value}%`),
            notInArray(gamesList.status, [Status.DROPPED, Status.PLAN_TO_PLAY]),
        ]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    getTimeSpentAchievementCte(_achievement: Achievement, userId?: number) {
        let baseCTE = getDbClient()
            .select({
                userId: gamesList.userId,
                value: sql`SUM(${gamesList.playtime}) / 60`.as("value"),
            }).from(gamesList)

        return this.applyWhereConditionsAndGrouping(baseCTE, [], userId);
    }

    getPlatformAchievementCte(_achievement: Achievement, userId?: number) {
        let baseCTE = getDbClient()
            .select({
                userId: gamesList.userId,
                value: countDistinct(gamesList.platform).as("value"),
            }).from(gamesList)

        const conditions = [notInArray(gamesList.status, [Status.DROPPED, Status.PLAN_TO_PLAY])]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    getSpecificPlatformAchievementCte(achievement: Achievement, userId?: number) {
        let baseCTE = getDbClient()
            .select({
                userId: gamesList.userId,
                value: count(gamesList.mediaId).as("value"),
            }).from(gamesList)

        const conditions = [
            eq(gamesList.platform, achievement.value as GamesPlatformsEnum),
            notInArray(gamesList.status, [Status.DROPPED, Status.PLAN_TO_PLAY]),
        ]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    getDurationAchievementCte(achievement: Achievement, userId?: number) {
        const value = parseInt(achievement.value!);
        const isLong = achievement.codeName.includes("long");

        let baseCTE = getDbClient()
            .select({
                userId: gamesList.userId,
                value: count(gamesList.mediaId).as("value"),
            }).from(gamesList)
            .innerJoin(games, eq(gamesList.mediaId, games.id))

        const conditions = [
            isLong ? gte(gamesList.playtime, value) : lte(gamesList.playtime, value),
            inArray(gamesList.status, [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER]),
        ]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    getCompanyAchievementCte(achievement: Achievement, userId?: number) {
        const isDevCompany = achievement.value = "developer";

        let subQ = getDbClient()
            .select({
                userId: gamesList.userId,
                count: count(gamesList.mediaId).as("count"),
            }).from(gamesList)
            .innerJoin(gamesCompanies, eq(gamesList.mediaId, gamesCompanies.mediaId))
            .where(and(
                notInArray(gamesList.status, [Status.DROPPED, Status.PLAN_TO_PLAY]),
                isDevCompany ? eq(gamesCompanies.developer, true) : eq(gamesCompanies.publisher, true)
            ))
            .groupBy(userId ? eq(gamesList.userId, userId) : gamesList.userId, gamesCompanies.name)
            .as("sub");

        return getDbClient()
            .select({
                userId: subQ.userId,
                value: max(subQ.count).as("value"),
            }).from(subQ)
            .groupBy(subQ.userId)
            .as("calculation");
    }

    getPerspectiveAchievementCte(achievement: Achievement, userId?: number) {
        let baseCTE = getDbClient()
            .select({
                userId: gamesList.userId,
                value: count(gamesList.mediaId).as("value"),
            }).from(gamesList)
            .innerJoin(games, eq(gamesList.mediaId, games.id))

        const conditions = [
            eq(games.playerPerspective, achievement.value as string),
            notInArray(gamesList.status, [Status.DROPPED, Status.PLAN_TO_PLAY]),
        ]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    // --- Advanced Stats  --------------------------------------------------

    async gameAvgPlaytime(userId?: number) {
        const forUser = userId ? eq(gamesList.userId, userId) : undefined;

        const avgDuration = await getDbClient()
            .select({
                average: sql<number | null>`avg(${gamesList.playtime})`.as("avg_playtime")
            })
            .from(gamesList)
            .where(and(forUser, ne(gamesList.status, Status.PLAN_TO_PLAY), isNotNull(gamesList.playtime)))
            .get();

        return avgDuration?.average;
    }

    async gamePlaytimeDistrib(userId?: number) {
        const forUser = userId ? eq(gamesList.userId, userId) : undefined;

        return getDbClient()
            .select({
                name: sql<number>`floor(log2(greatest(${gamesList.playtime} / 60, 1)))`,
                value: count(games.id).as("count"),
            })
            .from(games)
            .innerJoin(gamesList, eq(gamesList.mediaId, games.id))
            .where(and(forUser, ne(gamesList.status, Status.PLAN_TO_PLAY), isNotNull(gamesList.playtime)))
            .groupBy(sql<number>`floor(log2(greatest(${gamesList.playtime} / 60, 1)))`)
            .orderBy(asc(sql<number>`floor(log2(greatest(${gamesList.playtime} / 60, 1)))`));
    }

    async specificTopMetrics(userId?: number) {
        const developersConfig: ConfigTopMetric = {
            metricIdColumn: games.id,
            metricTable: gamesCompanies,
            mediaLinkColumn: gamesList.mediaId,
            metricNameColumn: gamesCompanies.name,
            filters: [ne(gamesList.status, Status.PLAN_TO_PLAY), eq(gamesCompanies.developer, true)],
        };
        const publishersConfig: ConfigTopMetric = {
            ...developersConfig,
            filters: [ne(gamesList.status, Status.PLAN_TO_PLAY), eq(gamesCompanies.publisher, true)],
        };
        const platformsConfig: ConfigTopMetric = {
            metricTable: gamesList,
            metricNameColumn: gamesList.platform,
            metricIdColumn: games.id,
            mediaLinkColumn: gamesList.mediaId,
            filters: [ne(gamesList.status, Status.PLAN_TO_PLAY)],
        };
        const enginesConfig: ConfigTopMetric = {
            metricTable: games,
            metricNameColumn: games.gameEngine,
            metricIdColumn: games.id,
            mediaLinkColumn: gamesList.mediaId,
            filters: [ne(gamesList.status, Status.PLAN_TO_PLAY)],
        };
        const perspectivesConfig: ConfigTopMetric = {
            metricTable: games,
            metricNameColumn: games.playerPerspective,
            metricIdColumn: games.id,
            mediaLinkColumn: gamesList.mediaId,
            filters: [ne(gamesList.status, Status.PLAN_TO_PLAY)],
        };

        const developersStats = await this.computeTopMetricStats(developersConfig, userId);
        const publishersStats = await this.computeTopMetricStats(publishersConfig, userId);
        const platformsStats = await this.computeTopMetricStats(platformsConfig, userId);
        const enginesStats = await this.computeTopMetricStats(enginesConfig, userId);
        const perspectivesStats = await this.computeTopMetricStats(perspectivesConfig, userId);

        return { developersStats, publishersStats, platformsStats, enginesStats, perspectivesStats };
    }

    async gameModesCount(userId?: number) {
        const forUser = userId ? eq(gamesList.userId, userId) : undefined;

        const data = await getDbClient()
            .select({ modes: games.gameModes })
            .from(games)
            .innerJoin(gamesList, eq(gamesList.mediaId, games.id))
            .where(and(forUser, ne(gamesList.status, Status.PLAN_TO_PLAY), isNotNull(games.gameModes)))
            .execute();

        const gameModes = data.flatMap(r => (r.modes ? r.modes.split(",") : []));

        const modeCounts: Record<string, number> = {};
        for (const mode of gameModes) {
            modeCounts[mode] = (modeCounts[mode] || 0) + 1;
        }

        const topValuesResult = Object.entries(modeCounts)
            .map(([name, value]) => ({ name, value: Number(value) || 0 }));

        return { topValues: topValuesResult };
    }
}
