import {db} from "@/lib/server/database/db";
import {notFound} from "@tanstack/react-router";
import {JobType, Status} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/async-storage";
import {ITvRepository} from "@/lib/server/types/repositories.types";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {AnimeSchemaConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {SeriesSchemaConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {and, asc, count, countDistinct, eq, getTableColumns, gte, ilike, inArray, isNotNull, like, lte, max, ne, notInArray, sql} from "drizzle-orm";
import {Achievement} from "@/lib/server/types/achievements";


export class TvRepository extends BaseRepository<SeriesSchemaConfig | AnimeSchemaConfig> implements ITvRepository {
    config: SeriesSchemaConfig | AnimeSchemaConfig;

    constructor(config: SeriesSchemaConfig | AnimeSchemaConfig) {
        super(config);
        this.config = config;
    }

    async getComingNext(userId: number) {
        const { mediaTable, listTable } = this.config;

        const comingNext = await getDbClient()
            .select({
                mediaId: mediaTable.id,
                mediaName: mediaTable.name,
                date: mediaTable.nextEpisodeToAir,
                imageCover: mediaTable.imageCover,
                seasonToAir: mediaTable.seasonToAir,
                episodeToAir: mediaTable.episodeToAir,
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(
                eq(listTable.userId, userId),
                notInArray(listTable.status, [Status.DROPPED, Status.RANDOM]),
                gte(mediaTable.nextEpisodeToAir, sql`CURRENT_TIMESTAMP`),
            ))
            .orderBy(asc(mediaTable.nextEpisodeToAir))
            .execute();

        return comingNext;
    }

    async computeAllUsersStats() {
        const { mediaTable, listTable } = this.config;

        const results = await getDbClient()
            .select({
                userId: listTable.userId,
                timeSpent: sql<number>`COALESCE(SUM(${listTable.total} * ${mediaTable.duration}), 0)`.as("timeSpent"),
                totalSpecific: sql<number>`COALESCE(SUM(${listTable.total}), 0)`.as("totalSpecific"),
                statusCounts: sql`
                    COALESCE((
                        SELECT 
                            JSON_GROUP_OBJECT(status, count_per_status) 
                        FROM (
                            SELECT 
                                status,
                                COUNT(*) as count_per_status 
                            FROM ${listTable} as sub_list 
                            WHERE sub_list.user_id = ${listTable.userId} GROUP BY status
                        )
                    ), '{}')
                `.as("statusCounts"),
                entriesFavorites: sql<number>`
                    COALESCE(SUM(CASE WHEN ${listTable.favorite} = 1 THEN 1 ELSE 0 END), 0)
                `.as("entriesFavorites"),
                totalRedo: sql<number>`COALESCE(SUM(${listTable.redo}), 0)`.as("totalRedo"),
                entriesCommented: sql<number>`
                    COALESCE(SUM(CASE WHEN LENGTH(TRIM(COALESCE(${listTable.comment}, ''))) > 0 THEN 1 ELSE 0 END), 0)
                `.as("entriesCommented"),
                totalEntries: count(listTable.mediaId).as("totalEntries"),
                entriesRated: count(listTable.rating).as("entriesRated"),
                sumEntriesRated: sql<number>`COALESCE(SUM(${listTable.rating}), 0)`.as("sumEntriesRated"),
                averageRating: sql<number>`
                    COALESCE(SUM(${listTable.rating}) * 1.0 / NULLIF(COUNT(${listTable.rating}), 0), 0.0)
                `.as("averageRating"),
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .groupBy(listTable.userId)
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
        const { mediaTable, listTable } = this.config;

        return getDbClient()
            .select({
                ...getTableColumns(mediaTable),
                mediaList: { ...getTableColumns(listTable) },
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(
                isNotNull(mediaTable.releaseDate),
                gte(mediaTable.releaseDate, sql`datetime('now')`),
                lte(mediaTable.releaseDate, sql`datetime('now', '+7 days')`),
            ))
            .orderBy(mediaTable.releaseDate)
            .execute();
    }

    async addMediaToUserList(userId: number, mediaId: number, newStatus: Status) {
        const { listTable } = this.config;
        const mediaEpsPerSeason = await this.getMediaEpsPerSeason(mediaId);

        let newTotal = 1;
        let newSeason = 1;
        let newEpisode = 1;

        if (newStatus === Status.COMPLETED) {
            newSeason = mediaEpsPerSeason[-1].season;
            newEpisode = mediaEpsPerSeason[-1].episodes;
            newTotal = mediaEpsPerSeason.reduce((acc, curr) => acc + curr.episodes, 0);
        }
        else if (newStatus === Status.PLAN_TO_WATCH || newStatus === Status.RANDOM) {
            newTotal = 0;
            newEpisode = 0;
        }

        const [newMedia] = await getDbClient()
            .insert(listTable)
            .values({
                userId,
                mediaId: mediaId,
                currentSeason: newSeason,
                lastEpisodeWatched: newEpisode,
                total: newTotal,
                status: newStatus,
                redo2: Array(mediaEpsPerSeason.length).fill(0),
            })
            .returning();

        return newMedia;
    }

    async getMediaEpsPerSeason(mediaId: number) {
        const { epsPerSeasonTable } = this.config;

        return getDbClient()
            .select({
                season: epsPerSeasonTable.season,
                episodes: epsPerSeasonTable.episodes,
            })
            .from(epsPerSeasonTable)
            .where(eq(epsPerSeasonTable.mediaId, mediaId))
            .orderBy(asc(epsPerSeasonTable.season))
            .execute();
    }

    async getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit = 25) {
        const { mediaTable, listTable, actorTable, networkTable } = this.config;

        let dataQuery = getDbClient()
            .selectDistinct({
                mediaId: mediaTable.id,
                mediaName: mediaTable.name,
                imageCover: mediaTable.imageCover,
                inUserList: isNotNull(listTable.userId).mapWith(Boolean).as("inUserList"),
            })
            .from(mediaTable)
            .leftJoin(listTable, and(eq(listTable.mediaId, mediaTable.id), eq(listTable.userId, userId)))
            .$dynamic();

        let countQuery = getDbClient()
            .select({ value: countDistinct(mediaTable.id) })
            .from(mediaTable)
            .$dynamic();

        let filterCondition;
        if (job === JobType.ACTOR) {
            dataQuery = dataQuery.innerJoin(actorTable, eq(actorTable.mediaId, mediaTable.id));
            countQuery = countQuery.innerJoin(actorTable, eq(actorTable.mediaId, mediaTable.id));
            filterCondition = like(actorTable.name, `%${name}%`);
        }
        else if (job === JobType.CREATOR) {
            filterCondition = like(mediaTable.createdBy, `%${name}%`);
        }
        else if (job === JobType.PLATFORM) {
            dataQuery = dataQuery.innerJoin(networkTable, eq(networkTable.mediaId, mediaTable.id));
            countQuery = countQuery.innerJoin(networkTable, eq(networkTable.mediaId, mediaTable.id));
            filterCondition = like(networkTable.name, `%${name}%`);
        }
        else {
            throw notFound();
        }

        if (filterCondition) {
            dataQuery = dataQuery.where(filterCondition);
            countQuery = countQuery.where(filterCondition);
        }

        const [totalResult, results] = await Promise.all([
            countQuery.execute(),
            dataQuery.orderBy(asc(mediaTable.releaseDate)).limit(limit).offset(offset).execute(),
        ]);

        const totalCount = totalResult[0]?.value ?? 0;

        return {
            items: results,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
        };
    }

    async getMediaIdsToBeRefreshed(apiIds: number[]) {
        const { mediaTable } = this.config;

        const mediaIds = await getDbClient()
            .select({ apiId: mediaTable.apiId })
            .from(mediaTable)
            .where(and(
                inArray(mediaTable.apiId, apiIds),
                lte(mediaTable.lastApiUpdate, sql`datetime(CURRENT_TIMESTAMP, '-1 day')`),
            ));

        return mediaIds.map((m: any) => m.apiId);
    }

    async findAllAssociatedDetails(mediaId: number) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.config;

        const mainData = await getDbClient()
            .select({
                ...getTableColumns(mediaTable),
                actors: sql`json_group_array(DISTINCT json_object('id', ${actorTable.id}, 'name', ${actorTable.name}))`.mapWith(JSON.parse),
                genres: sql`json_group_array(DISTINCT json_object('id', ${genreTable.id}, 'name', ${genreTable.name}))`.mapWith(JSON.parse),
                epsPerSeason: sql`json_group_array(DISTINCT json_object('id', ${epsPerSeasonTable.id}, 'season', ${epsPerSeasonTable.season}, 'episodes', ${epsPerSeasonTable.episodes}))`.mapWith(JSON.parse),
                networks: sql`json_group_array(DISTINCT json_object('id', ${networkTable.id}, 'name', ${networkTable.name}))`.mapWith(JSON.parse),
            })
            .from(mediaTable)
            .innerJoin(actorTable, eq(actorTable.mediaId, mediaTable.id))
            .innerJoin(genreTable, eq(genreTable.mediaId, mediaTable.id))
            .innerJoin(epsPerSeasonTable, eq(epsPerSeasonTable.mediaId, mediaTable.id))
            .innerJoin(networkTable, eq(networkTable.mediaId, mediaTable.id))
            .where(eq(mediaTable.id, mediaId))
            .groupBy(...Object.values(getTableColumns(mediaTable)))
            .get();

        if (!mainData) {
            throw notFound();
        }

        return { ...mainData };
    }

    async storeMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData }: any) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.config;

        const result = await db.transaction(async (tx) => {
            const [media] = await tx
                .insert(mediaTable)
                .values(mediaData)
                .returning()

            if (!media) {
                throw new Error("Failed to store the media details");
            }

            const mediaId = media.id;

            if (actorsData && actorsData.length > 0) {
                const actorsToAdd = actorsData.map((actor: any) => ({ mediaId, name: actor.name }));
                await tx.insert(actorTable).values(actorsToAdd)
            }

            if (genresData && genresData.length > 0) {
                const genresToAdd = genresData.map((genre: any) => ({ mediaId, name: genre.name }));
                await tx.insert(genreTable).values(genresToAdd)
            }

            if (seasonsData && seasonsData.length > 0) {
                const epsPerSeasonToAdd = seasonsData.map((eps: any) => ({ mediaId, season: eps.season, episodes: eps.episodes }));
                await tx.insert(epsPerSeasonTable).values(epsPerSeasonToAdd)
            }

            if (networkData && networkData.length > 0) {
                const networkToAdd = networkData.map((network: any) => ({ mediaId, name: network.name }));
                await tx.insert(networkTable).values(networkToAdd)
            }

            return mediaId;
        });

        return result
    }

    async updateMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData }: any) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.config;

        const tx = getDbClient();

        const [media] = await tx
            .update(mediaTable)
            .set({ ...mediaData, lastApiUpdate: sql`CURRENT_TIMESTAMP` })
            .where(eq(mediaTable.apiId, mediaData.apiId))
            .returning({ id: mediaTable.id })

        const mediaId = media.id;

        if (actorsData && actorsData.length > 0) {
            await tx.delete(actorTable).where(eq(actorTable.mediaId, mediaId));
            const actorsToAdd = actorsData.map((actor: any) => ({ mediaId, name: actor.name }));
            await tx.insert(actorTable).values(actorsToAdd)
        }

        if (genresData && genresData.length > 0) {
            await tx.delete(genreTable).where(eq(genreTable.mediaId, mediaId));
            const genresToAdd = genresData.map((genre: any) => ({ mediaId, name: genre.name }));
            await tx.insert(genreTable).values(genresToAdd)
        }

        if (seasonsData && seasonsData.length > 0) {
            await tx.delete(epsPerSeasonTable).where(eq(epsPerSeasonTable.mediaId, mediaId));
            const epsPerSeasonToAdd = seasonsData.map((eps: any) => ({ mediaId, season: eps.season, episodes: eps.episodes }));
            await tx.insert(epsPerSeasonTable).values(epsPerSeasonToAdd)
        }

        if (networkData && networkData.length > 0) {
            await tx.delete(networkTable).where(eq(networkTable.mediaId, mediaId));
            const networkToAdd = networkData.map((network: any) => ({ mediaId, name: network.name }));
            await tx.insert(networkTable).values(networkToAdd)
        }

        return true;
    }

    async getListFilters(userId: number) {
        const { genres, labels } = await super.getCommonListFilters(userId);
        const { mediaTable, listTable } = this.config;

        const country = await getDbClient()
            .selectDistinct({ name: mediaTable.originCountry })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(eq(listTable.userId, userId));

        return { country, genres, labels };
    }

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        const { mediaTable, listTable, actorTable, networkTable } = this.config;

        if (job === JobType.ACTOR) {
            const actors = await getDbClient()
                .selectDistinct({ name: actorTable.name })
                .from(actorTable)
                .innerJoin(listTable, eq(listTable.mediaId, actorTable.mediaId))
                .where(and(eq(listTable.userId, userId), ilike(actorTable.name, `%${query}%`)));
            return actors
        }
        else if (job === JobType.CREATOR) {
            const creatorsQuery = await getDbClient()
                .selectDistinct({ name: mediaTable.createdBy })
                .from(mediaTable)
                .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
                .where(and(eq(listTable.userId, userId), ilike(mediaTable.createdBy, `%${query}%`)));

            const creators = [...new Set(creatorsQuery
                .filter(c => c.name)
                .flatMap(c => c.name!.split(","))
                .filter(Boolean)
                .map(n => ({ name: n.trim() }))
            )];

            return creators
        }
        else if (job === JobType.PLATFORM) {
            const networks = await db
                .selectDistinct({ name: networkTable.name })
                .from(networkTable)
                .innerJoin(networkTable, eq(networkTable.mediaId, listTable.mediaId))
                .where(and(eq(listTable.userId, userId), like(networkTable.name, `%${query}%`)));
            return networks
        }
        else {
            throw new Error("Job type not supported");
        }
    }

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: Record<string, any>) {
        const { listTable } = this.config;

        const [result] = await getDbClient()
            .update(listTable)
            .set(updateData)
            .where(and(eq(listTable.userId, userId), eq(listTable.mediaId, mediaId)))
            .returning();

        return result;
    }

    // --- Achievements ----------------------------------------------------------

    getDurationAchievementCte(achievement: Achievement, userId?: number) {
        const { mediaTable, listTable } = this.config;

        const value = parseInt(achievement.value!);
        const isLong = achievement.codeName.includes("long");
        const condition = isLong ? gte(mediaTable.totalEpisodes, value) : lte(mediaTable.totalEpisodes, value);

        let baseCTE = getDbClient()
            .select({
                userId: listTable.userId,
                value: count(listTable.mediaId).as("value"),
            }).from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))

        const conditions = [eq(listTable.status, Status.COMPLETED), condition]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    getNetworkAchievementCte(_achievement: Achievement, userId?: number) {
        const { listTable, networkTable } = this.config;

        let baseCTE = getDbClient()
            .select({
                userId: listTable.userId,
                value: countDistinct(networkTable.name).as("value"),
            }).from(listTable)
            .innerJoin(networkTable, eq(listTable.mediaId, networkTable.mediaId))

        const conditions = [ne(listTable.status, Status.PLAN_TO_WATCH)]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    getActorAchievementCte(_achievement: Achievement, userId?: number) {
        const { listTable, actorTable } = this.config;

        let subQ = getDbClient()
            .select({
                userId: listTable.userId,
                count: count(listTable.mediaId).as("count"),
            }).from(listTable)
            .innerJoin(actorTable, eq(listTable.mediaId, actorTable.mediaId))
            .where(eq(listTable.status, Status.COMPLETED))
            .groupBy(userId ? eq(listTable.userId, userId) : listTable.userId, actorTable.name)
            .as("sub");

        return getDbClient()
            .select({
                userId: subQ.userId,
                value: max(subQ.count).as("value"),
            }).from(subQ)
            .groupBy(subQ.userId)
            .as("calculation");
    }

    // --- Advanced Stats  --------------------------------------------------

    async computeTotalSeasons(userId?: number) {
        const { listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        const totalSeasons = await getDbClient()
            .select({ totalSeasons: sql<number>`coalesce(sum(${listTable.currentSeason}), 0)` })
            .from(listTable)
            .where(and(forUser, ne(listTable.status, Status.PLAN_TO_WATCH)))
            .get();

        return totalSeasons?.totalSeasons;
    }

    async avgTvDuration(userId?: number) {
        const { mediaTable, listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        const avgDuration = await getDbClient()
            .select({
                average: sql<number | null>`avg(${mediaTable.duration} * ${listTable.total})`.as("avg_duration")
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(forUser, notInArray(listTable.status, [Status.RANDOM, Status.PLAN_TO_WATCH])))
            .get();

        return avgDuration?.average;
    }

    async tvDurationDistrib(userId?: number) {
        const { mediaTable, listTable } = this.config;

        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        return getDbClient()
            .select({
                name: sql<number>`floor((${mediaTable.duration} * ${listTable.total}) / 600.0) * 600`,
                value: count(mediaTable.id).as("count"),
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(forUser, notInArray(listTable.status, [Status.RANDOM, Status.PLAN_TO_WATCH])))
            .groupBy(sql<number>`floor((${mediaTable.duration} * ${listTable.total}) / 600.0) * 600`)
            .orderBy(asc(sql<number>`floor((${mediaTable.duration} * ${listTable.total}) / 600.0) * 600`));
    }

    async specificTopMetrics(userId?: number) {
        const { mediaTable, listTable, networkTable, actorTable } = this.config;

        const networkConfig = {
            metricTable: networkTable,
            metricNameColumn: networkTable.name,
            metricIdColumn: mediaTable.id,
            mediaLinkColumn: listTable.mediaId,
            filters: [notInArray(listTable.status, [Status.RANDOM, Status.PLAN_TO_WATCH])],
        };
        const countriesConfig = {
            metricTable: mediaTable,
            metricNameColumn: mediaTable.originCountry,
            metricIdColumn: mediaTable.id,
            mediaLinkColumn: listTable.mediaId,
            statusFilters: [notInArray(listTable.status, [Status.RANDOM, Status.PLAN_TO_WATCH])],
        };
        const actorsConfig = {
            metricTable: actorTable,
            metricNameColumn: actorTable.name,
            metricIdColumn: actorTable.mediaId,
            mediaLinkColumn: listTable.mediaId,
            statusFilters: [notInArray(listTable.status, [Status.RANDOM, Status.PLAN_TO_WATCH])],
        };

        const actorsStats = await this.computeTopMetricStats(actorsConfig, userId);
        const networksStats = await this.computeTopMetricStats(networkConfig, userId);
        const countriesStats = await this.computeTopMetricStats(countriesConfig, userId);

        return { countriesStats, actorsStats, networksStats };
    }
}
