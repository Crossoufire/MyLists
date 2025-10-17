import {notFound} from "@tanstack/react-router";
import {followers, user} from "@/lib/server/database/schema";
import {Achievement} from "@/lib/types/achievements.types";
import {MediaListArgs} from "@/lib/types/zod.schema.types";
import {getDbClient} from "@/lib/server/database/async-storage";
import {JobType, LabelAction, MediaType, Status} from "@/lib/utils/enums";
import {GenreTable, LabelTable, ListTable, MediaSchemaConfig, MediaTable} from "@/lib/types/media.config.types";
import {and, asc, avgDistinct, count, countDistinct, desc, eq, getTableColumns, gte, inArray, isNotNull, isNull, like, lte, ne, notInArray, SQL, sql} from "drizzle-orm";
import {
    AddedMediaDetails,
    ExpandedListFilters,
    FilterDefinition,
    FilterDefinitions,
    Label,
    ListFilterDefinition,
    MediaListData,
    TopMetricObject,
    UpComingMedia,
    UserFollowsMediaData,
    UserMediaStats,
    UserMediaWithLabels,
} from "@/lib/types/base.types";
import {seriesList} from "@/lib/server/database/schema/media/series.schema";
import {moviesList} from "@/lib/server/database/schema/media/movies.schema";
import {animeList} from "@/lib/server/database/schema/media/anime.schema";
import {gamesList} from "@/lib/server/database/schema/media/games.schema";
import {booksList} from "@/lib/server/database/schema/media/books.schema";
import {mangaList} from "@/lib/server/database/schema/media/manga.schema";


const DEFAULT_PER_PAGE = 25;
const SIMILAR_MAX_GENRES = 12;


export abstract class BaseRepository<TConfig extends MediaSchemaConfig<MediaTable, ListTable, GenreTable, LabelTable>> {
    readonly config: TConfig;
    protected readonly baseFilterDefs: FilterDefinitions;

    protected constructor(config: TConfig) {
        this.config = config;
        this.baseFilterDefs = this.baseListFiltersDefs();
    }

    private baseListFiltersDefs = (): FilterDefinitions => {
        const { listTable, mediaTable, labelTable, genreTable } = this.config;

        return {
            search: {
                isActive: (args: MediaListArgs) => !!args.search,
                getCondition: (args: MediaListArgs) => like(mediaTable.name, `%${args.search}%`),
            },
            favorite: {
                isActive: (args: MediaListArgs) => args.favorite === true,
                getCondition: (_args: MediaListArgs) => eq(listTable.favorite, true),
            },
            comment: {
                isActive: (args: MediaListArgs) => args.comment === true,
                getCondition: (_args: MediaListArgs) => isNotNull(listTable.comment),
            },
            hideCommon: {
                isActive: (args: MediaListArgs) => args.hideCommon === true && !!args.currentUserId && args.currentUserId !== args.userId,
                getCondition: (args: MediaListArgs) => {
                    const subQuery = getDbClient()
                        .select({ mediaId: listTable.mediaId })
                        .from(listTable)
                        .where(eq(listTable.userId, args.currentUserId!));
                    return notInArray(listTable.mediaId, subQuery);
                },
            },
            status: createArrayFilterDef({
                argName: "status",
                mediaTable: mediaTable,
                filterColumn: listTable.status,
            }),
            labels: createArrayFilterDef({
                argName: "labels",
                mediaTable: mediaTable,
                entityTable: labelTable,
                filterColumn: labelTable.name,
            }),
            genres: createArrayFilterDef({
                argName: "genres",
                mediaTable: mediaTable,
                entityTable: genreTable,
                filterColumn: genreTable.name,
            }),
        };
    }

    async getCoverFilenames() {
        const mediaTable = this.config.mediaTable;

        return getDbClient()
            .select({ imageCover: mediaTable.imageCover })
            .from(mediaTable)
            .execute()
    }

    async getNonListMediaIds() {
        const listTable = this.config.listTable;
        const mediaTable = this.config.mediaTable;

        const mediaToDelete = await getDbClient()
            .select({ id: sql<number>`${mediaTable.id}` })
            .from(mediaTable)
            .leftJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(isNull(listTable.userId))
            .execute();

        return mediaToDelete.map((media) => media.id);
    }

    async getUserMediaLabels(userId: number) {
        const labelTable = this.config.labelTable;

        return getDbClient()
            .selectDistinct({ name: sql<string>`${labelTable.name}` })
            .from(labelTable)
            .where(eq(labelTable.userId, userId))
            .orderBy(asc(labelTable.name));
    }

    async removeMediaByIds(mediaIds: number[]) {
        const tablesForDeletion = this.config.tablesForDeletion;

        for (const table of tablesForDeletion) {
            await getDbClient()
                .delete(table)
                .where(inArray(table.mediaId, mediaIds))
                .execute();
        }
    }

    async searchByName(query: string, limit: number = 20) {
        const { mediaTable } = this.config;

        return getDbClient()
            .select({ name: sql<string>`${mediaTable.name}` })
            .from(mediaTable)
            .where(like(mediaTable.name, `%${query}%`))
            .orderBy(mediaTable.name)
            .limit(limit);
    }

    async removeMediaFromUserList(userId: number, mediaId: number) {
        const { listTable, labelTable } = this.config;

        await getDbClient()
            .delete(listTable)
            .where(and(eq(listTable.userId, userId), eq(listTable.mediaId, mediaId)))
            .execute();

        await getDbClient()
            .delete(labelTable)
            .where(and(eq(labelTable.userId, userId), eq(labelTable.mediaId, mediaId)))
            .execute();
    }

    async findSimilarMedia(mediaId: number) {
        const { mediaTable, genreTable } = this.config;

        const targetGenresSubQuery = getDbClient()
            .select({ name: genreTable.name })
            .from(genreTable)
            .where(eq(genreTable.mediaId, mediaId));

        const similarSub = getDbClient()
            .select({
                mediaId: genreTable.mediaId,
                commonGenreCount: count(genreTable.name).as("common_genre_count")
            })
            .from(genreTable)
            .where(and(ne(genreTable.mediaId, mediaId), inArray(genreTable.name, targetGenresSubQuery)))
            .groupBy(genreTable.mediaId)
            .orderBy(desc(sql`common_genre_count`))
            .limit(SIMILAR_MAX_GENRES)
            .as("similar_media");

        return getDbClient()
            .select({
                mediaCover: mediaTable.imageCover,
                mediaId: sql<number>`${mediaTable.id}`,
                mediaName: sql<string>`${mediaTable.name}`,
            })
            .from(similarSub)
            .innerJoin(mediaTable, eq(mediaTable.id, similarSub.mediaId))
            .orderBy(desc(similarSub.commonGenreCount));
    }

    async getCommonListFilters(userId: number) {
        const { genreTable, labelTable, listTable } = this.config;

        const genresPromise = getDbClient()
            .selectDistinct({ name: sql<string>`${genreTable.name}` })
            .from(genreTable)
            .innerJoin(listTable, eq(listTable.mediaId, genreTable.mediaId))
            .where(eq(listTable.userId, userId))
            .orderBy(asc(genreTable.name));

        const labelsPromise = getDbClient()
            .selectDistinct({ name: sql<string>`${labelTable.name}` })
            .from(labelTable)
            .where(and(eq(labelTable.userId, userId)))
            .orderBy(asc(labelTable.name));

        const [genres, labels] = await Promise.all([genresPromise, labelsPromise]);

        return { genres, labels };
    }

    async getUserFavorites(userId: number, limit = 8) {
        const { listTable, mediaTable } = this.config;

        return getDbClient()
            .select({
                mediaCover: mediaTable.imageCover,
                mediaId: sql<number>`${mediaTable.id}`,
                mediaName: sql<string>`${mediaTable.name}`,
            })
            .from(listTable)
            .where(and(eq(listTable.userId, userId), eq(listTable.favorite, true)))
            .leftJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .limit(limit)
    }

    async editUserLabel(userId: number, label: Label, mediaId: number, action: LabelAction) {
        const labelTable = this.config.labelTable;

        if (action === LabelAction.ADD) {
            const [labelData] = await getDbClient()
                .insert(labelTable)
                .values({ userId, name: label.name, mediaId })
                .returning({ name: labelTable.name })
            return labelData as Label;
        }
        else if (action === LabelAction.RENAME) {
            const [labelData] = await getDbClient()
                .update(labelTable)
                .set({ name: label.name })
                .where(and(eq(labelTable.userId, userId), eq(labelTable.name, label?.oldName)))
                .returning({ name: labelTable.name })
            return labelData as Label;
        }
        else if (action === LabelAction.DELETE_ONE) {
            await getDbClient()
                .delete(labelTable)
                .where(and(eq(labelTable.userId, userId), eq(labelTable.name, label.name), eq(labelTable.mediaId, mediaId)))
                .execute();
        }
        else if (action === LabelAction.DELETE_ALL) {
            await getDbClient()
                .delete(labelTable)
                .where(and(eq(labelTable.userId, userId), eq(labelTable.name, label.name)))
                .execute();
        }
    }

    async findById(mediaId: number): Promise<TConfig["mediaTable"]["$inferSelect"] | undefined> {
        const { mediaTable } = this.config;

        const result = await getDbClient()
            .select()
            .from(mediaTable)
            .where(eq(mediaTable.id, mediaId))
            .get();

        return result;
    }

    async findByApiId(apiId: number | string): Promise<TConfig["mediaTable"]["$inferSelect"] | undefined> {
        const { mediaTable } = this.config;

        const result = await getDbClient()
            .select()
            .from(mediaTable)
            .where(eq(mediaTable.apiId, apiId))
            .get()

        return result;
    }

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: TConfig["listTable"]["$inferSelect"]): Promise<TConfig["listTable"]["$inferSelect"]> {
        const { listTable } = this.config;

        const [result] = await getDbClient()
            .update(listTable)
            .set(updateData)
            .where(and(eq(listTable.userId, userId), eq(listTable.mediaId, mediaId)))
            .returning();

        return result;
    }

    async findUserMedia(userId: number, mediaId: number): Promise<UserMediaWithLabels<TConfig["listTable"]["$inferSelect"]> | null> {
        const { listTable, labelTable } = this.config;

        const mainUserMediaData = await getDbClient()
            .select({
                ...getTableColumns(listTable),
                ratingSystem: user.ratingSystem,
            })
            .from(listTable)
            .innerJoin(user, eq(user.id, listTable.userId))
            .where(and(eq(listTable.userId, userId), eq(listTable.mediaId, mediaId)))
            .get()

        if (!mainUserMediaData) {
            return null;
        }

        const associatedLabels = await getDbClient()
            .select({ name: sql<string>`${labelTable.name}` })
            .from(labelTable)
            .where(and(eq(labelTable.mediaId, mediaId), eq(labelTable.userId, userId)))
            .orderBy(asc(labelTable.name))
            .execute();

        if (!associatedLabels) {
            return null;
        }

        return {
            ...mainUserMediaData,
            labels: associatedLabels,
        };
    }

    async downloadMediaListAsCSV(userId: number): Promise<(TConfig["mediaTable"]["$inferSelect"] & { mediaName: string })[] | undefined> {
        const { mediaTable, listTable } = this.config;

        const data = await getDbClient()
            .select({
                mediaName: sql<string>`${mediaTable.name}`,
                ...getTableColumns(listTable),
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .where(eq(listTable.userId, userId));

        return data;
    }

    async getUserFollowsMediaData(userId: number, mediaId: number): Promise<UserFollowsMediaData<TConfig["listTable"]["$inferSelect"]>[]> {
        const { listTable } = this.config;

        const inFollowsLists = await getDbClient()
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                userMedia: listTable,
                ratingSystem: user.ratingSystem,
            })
            .from(followers)
            .innerJoin(user, eq(user.id, followers.followedId))
            .innerJoin(listTable, eq(listTable.userId, followers.followedId))
            .where(and(eq(followers.followerId, userId), eq(listTable.mediaId, mediaId)));

        return inFollowsLists;
    }

    async getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs): Promise<MediaListData<TConfig["listTable"]["$inferSelect"]>> {
        const { listTable, mediaTable, labelTable, mediaList } = this.config;

        const page = args.page ?? 1;
        const perPage = args.perPage ?? DEFAULT_PER_PAGE;
        const offset = (page - 1) * perPage;

        const sortKeyName = args.sort ? args.sort : mediaList.defaultSortName;
        const selectedSort = mediaList.availableSorts[sortKeyName];
        const filterArgs = { ...args, currentUserId, userId };

        const allFilters = {
            ...this.baseFilterDefs,
            ...mediaList.filterDefinitions,
        };

        // Main query builder
        let queryBuilder = getDbClient()
            .select({
                ...mediaList.baseSelection,
                ratingSystem: user.ratingSystem,
                labels: sql` COALESCE((
                    SELECT json_group_array(DISTINCT json_object(
                        'id', l.id, 
                        'name', l.name
                    ))
                    FROM ${labelTable} l
                    WHERE l.media_id = ${listTable.mediaId} AND l.user_id = ${listTable.userId}
                    ), json_array()
                )`.mapWith(JSON.parse),
            })
            .from(listTable)
            .innerJoin(user, eq(listTable.userId, user.id))
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();

        // Count query builder
        let countQueryBuilder = getDbClient()
            .select({ count: count() })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();

        // Iterate through all filters
        const conditions = [eq(listTable.userId, userId)];
        for (const filterName of Object.keys(allFilters)) {
            const currentFilter = allFilters[filterName as keyof MediaListArgs];
            if (currentFilter?.isActive(filterArgs)) {
                const condition = currentFilter.getCondition(filterArgs);
                if (condition) {
                    conditions.push(condition);
                }
            }
        }

        // Finish building query
        queryBuilder = queryBuilder.where(and(...conditions));
        countQueryBuilder = countQueryBuilder.where(and(...conditions));
        const finalQuery = queryBuilder
            .orderBy(...(Array.isArray(selectedSort) ? selectedSort : [selectedSort]))
            .limit(perPage)
            .offset(offset);

        // Execute query
        const [results, totalResult] = await Promise.all([finalQuery.execute(), countQueryBuilder.get()]);

        // Calculate total pages
        const totalItems = totalResult?.count ?? 0;
        const totalPages = Math.ceil(totalItems / perPage);

        // Fetch common IDs (if in filter)
        let commonIdsSet = new Set<number>();
        if (currentUserId && currentUserId !== userId && !filterArgs.hideCommon && results.length > 0) {
            const mediaIds = results.map((m: any) => m.mediaId);
            const commonMediaIdsResult = await getDbClient()
                .select({ mediaId: listTable.mediaId })
                .from(listTable)
                .where(and(eq(listTable.userId, currentUserId), inArray(listTable.mediaId, mediaIds)))
                .execute();

            commonIdsSet = new Set(commonMediaIdsResult.map(m => m.mediaId));
        }

        // Process results by adding common flag
        const processedResults = results.map((item: any) => ({
            ...item,
            common: commonIdsSet.has(item.mediaId),
        }));

        return {
            items: processedResults,
            pagination: {
                page,
                perPage,
                totalPages,
                totalItems,
                sorting: sortKeyName,
                availableSorting: Object.keys(mediaList.availableSorts),
            },
        };
    }

    async getUpcomingMedia(userId?: number, maxAWeek?: boolean): Promise<UpComingMedia[]> {
        const { listTable, mediaTable } = this.config;

        return getDbClient()
            .select({
                mediaId: mediaTable.id,
                userId: listTable.userId,
                status: listTable.status,
                mediaName: mediaTable.name,
                date: mediaTable.releaseDate,
                imageCover: mediaTable.imageCover,
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(
                notInArray(listTable.status, [Status.DROPPED]),
                userId ? eq(listTable.userId, userId) : undefined,
                gte(mediaTable.releaseDate, sql`datetime('now')`),
                maxAWeek ? lte(mediaTable.releaseDate, sql`datetime('now', '+7 days')`) : undefined,
            ))
            .orderBy(asc(mediaTable.releaseDate))
            .execute();
    }

    async getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit = 25) {
        const { mediaTable, listTable, jobDefinitions } = this.config;

        const jobHandler = jobDefinitions[job];
        if (!jobHandler) throw notFound();

        const { sourceTable, nameColumn, mediaIdColumn } = jobHandler;

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

        if (sourceTable !== mediaTable) {
            const joinCondition = eq(mediaIdColumn, mediaTable.id);
            dataQuery.innerJoin(sourceTable, joinCondition);
            countQuery.innerJoin(sourceTable, joinCondition);
        }

        const filterCondition = jobHandler.getFilter ? jobHandler.getFilter(name) : like(nameColumn, `%${name}%`);
        dataQuery = dataQuery.where(filterCondition);
        countQuery = countQuery.where(filterCondition);

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
    };

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        const { listTable, jobDefinitions } = this.config;

        const jobHandler = jobDefinitions[job];
        if (!jobHandler) throw notFound();

        const { sourceTable, nameColumn, mediaIdColumn, postProcess } = jobHandler;

        const results = await getDbClient()
            .selectDistinct({ name: sql<string>`${nameColumn}` })
            .from(sourceTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaIdColumn))
            .where(and(eq(listTable.userId, userId), like(nameColumn, `%${query}%`)))
            .execute();

        if (postProcess) {
            return postProcess(results);
        }

        return results;
    }

    protected async _computeAllUsersStats(timeSpentStat: SQL, totalSpecificStat: SQL, totalRedoStat?: SQL) {
        const { listTable, mediaTable } = this.config;

        let redoStat;
        if (totalRedoStat) {
            redoStat = totalRedoStat;
        }
        else if (listTable?.redo) {
            redoStat = sql<number>`COALESCE(SUM(${listTable.redo}), 0)`
        }
        else {
            redoStat = sql<number>`0`;
        }

        const results = await getDbClient()
            .select({
                userId: sql<number>`${listTable.userId}`,
                timeSpent: timeSpentStat.as("timeSpent"),
                totalSpecific: totalSpecificStat.as("totalSpecific"),
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
                totalRedo: redoStat.as("totalRedo"),
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

    // --- Achievements ----------------------------------------------------------

    specificGenreAchievementCte(achievement: Achievement, userId?: number) {
        const { mediaTable, listTable, genreTable } = this.config;

        const baseCTE = getDbClient()
            .select({
                userId: listTable.userId,
                value: count(listTable.mediaId).as("value"),
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .innerJoin(genreTable, eq(mediaTable.id, genreTable.mediaId));

        const conditions = [eq(listTable.status, Status.COMPLETED), eq(genreTable.name, achievement.value)];

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    countAchievementCte(condition: SQL, _achievement: Achievement, userId?: number) {
        const { listTable } = this.config;

        const baseCTE = getDbClient()
            .select({
                userId: listTable.userId,
                value: count(listTable.mediaId).as("value"),
            }).from(listTable);

        return this.applyWhereConditionsAndGrouping(baseCTE, [condition], userId);
    }

    applyWhereConditionsAndGrouping(cte: any, baseConditions: SQL[], userId?: number) {
        const { listTable } = this.config;
        const conditions = userId ? [...baseConditions, eq(listTable.userId, userId)] : [...baseConditions];

        return cte.where(and(...conditions))
            .groupBy(listTable.userId)
            .as("calculation");
    }

    // --- Advanced Stats ---------------------------------------------------

    async computeRatingStats(userId?: number) {
        const { listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        const rows = await getDbClient()
            .select({
                rating: listTable.rating,
                count: count(listTable.rating),
            })
            .from(listTable)
            .where(and(forUser, isNotNull(listTable.rating)))
            .groupBy(listTable.rating)
            .orderBy(asc(listTable.rating))
            .execute();

        const buckets = Array.from({ length: 21 }, (_, i) => ({
            name: (i * 0.5).toFixed(1),
            value: 0,
        }));

        for (const r of rows) {
            if (r.rating == null) continue;
            const idx = Math.round(Number(r.rating) * 2);
            if (idx >= 0 && idx < buckets.length) buckets[idx].value = r.count;
        }

        return buckets;
    }

    async computeReleaseDateStats(userId?: number) {
        const { mediaTable, listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        const decadeExpression = sql<number>`(CAST(strftime('%Y', ${mediaTable.releaseDate}) AS INTEGER) / 10) * 10`;

        const releaseDates = await getDbClient()
            .select({
                name: decadeExpression,
                value: sql<number>`COUNT(${mediaTable.id})`,
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(forUser, isNotNull(mediaTable.releaseDate)))
            .groupBy(decadeExpression)
            .orderBy(asc(decadeExpression))
            .execute();

        return releaseDates;
    }

    async computeTotalMediaLabel(userId?: number) {
        const { labelTable } = this.config;
        const forUser = userId ? eq(labelTable.userId, userId) : undefined;

        const result = await getDbClient()
            .selectDistinct({ count: count(labelTable.name) })
            .from(labelTable)
            .where(and(forUser))
            .get();

        return result?.count ?? 0;
    }

    async computeTopGenresStats(userId?: number) {
        const { genreTable, listTable } = this.config;

        const metricStatsConfig = {
            metricTable: genreTable,
            metricNameCol: genreTable.name,
            metricIdCol: genreTable.mediaId,
            mediaLinkCol: listTable.mediaId,
            filters: [notInArray(listTable.status, [Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ])],
        };

        return this.computeTopMetricStats(metricStatsConfig, userId);
    }

    async computeTopMetricStats(statsConfig: TopMetricObject, userId?: number) {
        const { mediaTable, listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;
        const { metricTable, metricIdCol, metricNameCol, mediaLinkCol, filters, limit = 10, minRatingCount = 5 } = statsConfig;
        const isDifferentTable = (metricTable !== mediaTable) && (metricTable !== listTable);

        const countAlias = count(metricNameCol);
        let topValuesBuilder = getDbClient()
            .select({
                name: sql<string>`${metricNameCol}`,
                value: countAlias,
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();
        if (isDifferentTable) topValuesBuilder = topValuesBuilder.innerJoin(metricTable, eq(mediaLinkCol, metricIdCol));
        const topValuesQuery = topValuesBuilder
            .where(and(forUser, isNotNull(metricNameCol), ...filters))
            .groupBy(metricNameCol)
            .orderBy(desc(countAlias))
            .limit(limit);

        const avgRatingAlias = avgDistinct(listTable.rating);
        const ratingCountAlias = count(listTable.rating);
        let topRatedBuilder = getDbClient()
            .select({
                name: sql<string>`${metricNameCol}`,
                value: avgRatingAlias,
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();
        if (isDifferentTable) topRatedBuilder = topRatedBuilder.innerJoin(metricTable, eq(mediaLinkCol, metricIdCol));
        const topRatedQuery = topRatedBuilder
            .where(and(forUser, isNotNull(metricNameCol), isNotNull(listTable.rating), ...filters))
            .groupBy(metricNameCol)
            .having(gte(ratingCountAlias, minRatingCount))
            .orderBy(desc(avgRatingAlias))
            .limit(limit);

        const favoriteCountAlias = count(metricNameCol);
        let topFavoritedBuilder = getDbClient()
            .select({
                name: sql<string>`${metricNameCol}`,
                value: favoriteCountAlias,
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();
        if (isDifferentTable) topFavoritedBuilder = topFavoritedBuilder.innerJoin(metricTable, eq(mediaLinkCol, metricIdCol));
        const topFavoritedQuery = topFavoritedBuilder
            .where(and(forUser, isNotNull(metricNameCol), eq(listTable.favorite, true), ...filters))
            .groupBy(metricNameCol)
            .orderBy(desc(favoriteCountAlias))
            .limit(limit);

        const [topValues, topRated, topFavorited] = await Promise.all([topValuesQuery, topRatedQuery, topFavoritedQuery]);
        const defaultEntry = [{ name: "-", value: "-" }];

        return {
            topValues: topValues.length ? topValues.map(row => ({ name: row.name, value: row.value || 0 })) : defaultEntry,
            topRated: topRated.length ? topRated.map(row => ({ name: row.name, value: Number(row.value).toFixed(2) || "-" })) : defaultEntry,
            topFavorited: topFavorited.length ? topFavorited.map(row => ({ name: row.name, value: row.value || 0 })) : defaultEntry,
        };
    }

    // --- Abstract Methods -----------------------------------------------------------------

    abstract computeAllUsersStats(): Promise<UserMediaStats[]>;

    abstract storeMediaWithDetails(params: any): Promise<number>;

    abstract updateMediaWithDetails(params: any): Promise<boolean>;

    abstract getListFilters(userId: number): Promise<ExpandedListFilters>;

    abstract addMediaToUserList(userId: number, media: any, newStatus: Status): Promise<TConfig["listTable"]["$inferSelect"]>;

    abstract findAllAssociatedDetails(mediaId: number): Promise<(TConfig["mediaTable"]["$inferSelect"] & AddedMediaDetails) | undefined>;
}


const isValidFilter = <T>(value: T) => {
    return Array.isArray(value) && value.length > 0;
}


export const createArrayFilterDef = ({ argName, entityTable, filterColumn, mediaTable }: ListFilterDefinition): FilterDefinition => {
    return {
        isActive: (args: MediaListArgs) => isValidFilter(args[argName]),
        getCondition: (args: MediaListArgs) => {
            const dataArray = args[argName] as string[];

            // If no entityTable provided, filter directly on mediaTable
            if (!entityTable) {
                return inArray(filterColumn, dataArray);
            }

            // Otherwise, subquery for relational filtering
            const subQuery = getDbClient()
                .select({ mediaId: entityTable.mediaId })
                .from(entityTable)
                .where(inArray(filterColumn, dataArray));

            return inArray(mediaTable.id, subQuery);
        },
    };
}


type TListByType = {
    [MediaType.SERIES]: typeof seriesList.$inferSelect;
    [MediaType.ANIME]: typeof animeList.$inferSelect;
    [MediaType.MOVIES]: typeof moviesList.$inferSelect;
    [MediaType.GAMES]: typeof gamesList.$inferSelect;
    [MediaType.BOOKS]: typeof booksList.$inferSelect & { pages: number };
    [MediaType.MANGA]: typeof mangaList.$inferSelect & { chapters: number };
};

export type MediaListDataByType = {
    [K in MediaType]: MediaListData<TListByType[K]>;
};
