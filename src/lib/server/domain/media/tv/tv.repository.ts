import {Status} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/async-storage";
import {Achievement} from "@/lib/server/types/achievements.types";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {AddedMediaDetails, ConfigTopMetric} from "@/lib/server/types/base.types";
import {TvType, UpsertTvWithDetails} from "@/lib/server/domain/media/tv/tv.types";
import {AnimeSchemaConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {SeriesSchemaConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {and, asc, count, countDistinct, eq, getTableColumns, gte, inArray, isNotNull, lte, max, ne, notInArray, sql} from "drizzle-orm";


export class TvRepository extends BaseRepository<AnimeSchemaConfig | SeriesSchemaConfig> {
    config: SeriesSchemaConfig | AnimeSchemaConfig;

    constructor(config: SeriesSchemaConfig | AnimeSchemaConfig) {
        super(config);
        this.config = config;
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

    async getMediaIdsToBeRefreshed(apiIds: number[]) {
        const { mediaTable } = this.config;

        const mediaIds = await getDbClient()
            .select({ apiId: mediaTable.apiId })
            .from(mediaTable)
            .where(and(
                inArray(mediaTable.apiId, apiIds),
                lte(mediaTable.lastApiUpdate, sql`datetime('now', '-1 day')`),
            ));

        return mediaIds.map((m) => m.apiId);
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
                average: sql<number | null>`AVG(${mediaTable.duration} * ${listTable.total})`
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(forUser, notInArray(listTable.status, [Status.RANDOM, Status.PLAN_TO_WATCH])))
            .get();

        return avgDuration?.average ? (avgDuration.average / 60).toFixed(2) : 0;
    }

    async tvDurationDistrib(userId?: number) {
        const { mediaTable, listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        return getDbClient()
            .select({
                name: sql<number>`(floor((${mediaTable.duration} * ${mediaTable.totalEpisodes}) / 600.0) * 600) / 60`,
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

        const filters = [notInArray(listTable.status, [Status.RANDOM, Status.PLAN_TO_WATCH])]

        const networkConfig: ConfigTopMetric = {
            metricTable: networkTable,
            metricNameCol: networkTable.name,
            metricIdCol: networkTable.mediaId,
            mediaLinkCol: listTable.mediaId,
            minRatingCount: 3,
            filters,
        };
        const countriesConfig: ConfigTopMetric = {
            metricTable: mediaTable,
            metricIdCol: mediaTable.id,
            mediaLinkCol: listTable.mediaId,
            metricNameCol: mediaTable.originCountry,
            filters,
        };
        const actorsConfig: ConfigTopMetric = {
            metricTable: actorTable,
            metricNameCol: actorTable.name,
            metricIdCol: actorTable.mediaId,
            mediaLinkCol: listTable.mediaId,
            minRatingCount: 3,
            filters,
        };

        const actorsStats = await this.computeTopMetricStats(actorsConfig, userId);
        const networksStats = await this.computeTopMetricStats(networkConfig, userId);
        const countriesStats = await this.computeTopMetricStats(countriesConfig, userId);

        return { countriesStats, actorsStats, networksStats };
    }

    // --- Implemented Methods ------------------------------------------------

    async computeAllUsersStats() {
        const { mediaTable, listTable } = this.config;

        const timeSpentStat = sql<number>`COALESCE(SUM(${listTable.total} * ${mediaTable.duration}), 0)`;
        const totalSpecificStat = sql<number>`COALESCE(SUM(${listTable.total}), 0)`;
        const totalRedoStat = sql<number>`(SELECT COALESCE(SUM(value), 0) FROM json_each(${listTable.redo2}))`;

        return this._computeAllUsersStats(timeSpentStat, totalSpecificStat, totalRedoStat)
    }

    async getUpcomingMedia(userId?: number, maxAWeek?: boolean) {
        const { mediaTable, listTable, epsPerSeasonTable } = this.config;

        const epsSubq = getDbClient()
            .select({
                mediaId: epsPerSeasonTable.mediaId,
                maxSeason: max(epsPerSeasonTable.season).as("maxSeason"),
                lastEpisode: max(epsPerSeasonTable.episodes).as("lastEpisode"),
            }).from(epsPerSeasonTable)
            .groupBy(epsPerSeasonTable.mediaId)
            .as("epsSubq");

        return getDbClient()
            .select({
                mediaId: mediaTable.id,
                userId: listTable.userId,
                status: listTable.status,
                mediaName: mediaTable.name,
                lastEpisode: epsSubq.lastEpisode,
                date: mediaTable.nextEpisodeToAir,
                imageCover: mediaTable.imageCover,
                seasonToAir: mediaTable.seasonToAir,
                episodeToAir: mediaTable.episodeToAir,
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .innerJoin(epsSubq, eq(mediaTable.id, epsSubq.mediaId))
            .where(and(
                userId ? eq(listTable.userId, userId) : undefined,
                notInArray(listTable.status, [Status.DROPPED, Status.RANDOM]),
                gte(mediaTable.nextEpisodeToAir, sql`datetime('now')`),
                maxAWeek ? lte(mediaTable.nextEpisodeToAir, sql`datetime('now', '+7 days')`) : undefined,
            ))
            .orderBy(asc(mediaTable.nextEpisodeToAir))
            .execute();
    }

    async addMediaToUserList(userId: number, media: TvType, newStatus: Status) {
        const { listTable } = this.config;
        const epsPerSeason = await this.getMediaEpsPerSeason(media.id);

        let newTotal = 1;
        let newSeason = 1;
        let newEpisode = 1;

        if (newStatus === Status.COMPLETED) {
            newSeason = epsPerSeason.at(-1)!.season;
            newEpisode = epsPerSeason.at(-1)!.episodes;
            newTotal = epsPerSeason.reduce((acc, curr) => acc + curr.episodes, 0);
        }
        else if (newStatus === Status.PLAN_TO_WATCH || newStatus === Status.RANDOM) {
            newTotal = 0;
            newEpisode = 0;
        }

        const [newMedia] = await getDbClient()
            .insert(listTable)
            .values({
                userId,
                total: newTotal,
                mediaId: media.id,
                status: newStatus,
                currentSeason: newSeason,
                lastEpisodeWatched: newEpisode,
                redo2: Array(epsPerSeason.length).fill(0),
            })
            .returning();

        return newMedia;
    }

    async findAllAssociatedDetails(mediaId: number) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.config;

        const details = await getDbClient()
            .select({
                ...getTableColumns(mediaTable),
                actors: sql`json_group_array(DISTINCT json_object('id', ${actorTable.id}, 'name', ${actorTable.name}))`.mapWith(JSON.parse),
                genres: sql`json_group_array(DISTINCT json_object('id', ${genreTable.id}, 'name', ${genreTable.name}))`.mapWith(JSON.parse),
                epsPerSeason: sql`json_group_array(DISTINCT json_object('season', ${epsPerSeasonTable.season}, 'episodes', ${epsPerSeasonTable.episodes}))`.mapWith(JSON.parse),
                networks: sql`json_group_array(DISTINCT json_object('id', ${networkTable.id}, 'name', ${networkTable.name}))`.mapWith(JSON.parse),
            })
            .from(mediaTable)
            .leftJoin(actorTable, eq(actorTable.mediaId, mediaTable.id))
            .leftJoin(genreTable, eq(genreTable.mediaId, mediaTable.id))
            .leftJoin(epsPerSeasonTable, eq(epsPerSeasonTable.mediaId, mediaTable.id))
            .leftJoin(networkTable, eq(networkTable.mediaId, mediaTable.id))
            .where(eq(mediaTable.id, mediaId))
            .get();

        if (!details) return;

        const result: TvType & AddedMediaDetails = {
            ...details,
            genres: details.genres || [],
            actors: details.actors || [],
            networks: details.networks || [],
            epsPerSeason: details.epsPerSeason || [],
        };

        return result;
    }

    async storeMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData }: UpsertTvWithDetails) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.config;
        const tx = getDbClient();

        const [media] = await tx
            .insert(mediaTable)
            .values({
                ...mediaData,
                lastApiUpdate: sql`datetime('now')`,
            })
            .returning()

        const mediaId = media.id;
        if (actorsData && actorsData.length > 0) {
            const actorsToAdd = actorsData.map((a) => ({ mediaId, ...a }));
            await tx.insert(actorTable).values(actorsToAdd)
        }

        if (genresData && genresData.length > 0) {
            const genresToAdd = genresData.map((g) => ({ mediaId, ...g }));
            await tx.insert(genreTable).values(genresToAdd)
        }

        if (seasonsData && seasonsData.length > 0) {
            const epsPerSeasonToAdd = seasonsData.map((data) => ({ mediaId, ...data }));
            await tx.insert(epsPerSeasonTable).values(epsPerSeasonToAdd)
        }

        if (networkData && networkData.length > 0) {
            const networkToAdd = networkData.map((n) => ({ mediaId, ...n }));
            await tx.insert(networkTable).values(networkToAdd)
        }

        return mediaId;
    }

    async updateMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData }: UpsertTvWithDetails) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.config;

        const tx = getDbClient();

        const [media] = await tx
            .update(mediaTable)
            .set({ ...mediaData, lastApiUpdate: sql`datetime('now')` })
            .where(eq(mediaTable.apiId, mediaData.apiId))
            .returning({ id: mediaTable.id });

        const mediaId = media.id;

        if (actorsData && actorsData.length > 0) {
            await tx.delete(actorTable).where(eq(actorTable.mediaId, mediaId));
            const actorsToAdd = actorsData.map((a) => ({ mediaId, ...a }));
            await tx.insert(actorTable).values(actorsToAdd);
        }

        if (genresData && genresData.length > 0) {
            await tx.delete(genreTable).where(eq(genreTable.mediaId, mediaId));
            const genresToAdd = genresData.map((g) => ({ mediaId, ...g }));
            await tx.insert(genreTable).values(genresToAdd);
        }

        if (seasonsData && seasonsData.length > 0) {
            await tx.delete(epsPerSeasonTable).where(eq(epsPerSeasonTable.mediaId, mediaId));
            const epsPerSeasonToAdd = seasonsData.map((data) => ({ mediaId, ...data }));
            await tx.insert(epsPerSeasonTable).values(epsPerSeasonToAdd);
        }

        if (networkData && networkData.length > 0) {
            await tx.delete(networkTable).where(eq(networkTable.mediaId, mediaId));
            const networkToAdd = networkData.map((n) => ({ mediaId, ...n }));
            await tx.insert(networkTable).values(networkToAdd);
        }

        return true;
    }

    async getListFilters(userId: number) {
        const { mediaTable, listTable } = this.config;
        const { genres, labels } = await super.getCommonListFilters(userId);

        const langs = await getDbClient()
            .selectDistinct({ name: sql<string>`${mediaTable.originCountry}` })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(eq(listTable.userId, userId), isNotNull(mediaTable.originCountry)));

        return { langs, genres, labels };
    }
}
