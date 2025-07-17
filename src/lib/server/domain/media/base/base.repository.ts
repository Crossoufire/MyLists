import {Label} from "@/lib/components/types";
import {followers, user} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/async-storage";
import {Achievement} from "@/lib/server/types/achievements.types";
import {JobType, LabelAction, Status} from "@/lib/server/utils/enums";
import {GenreTable, LabelTable, ListTable, MediaSchemaConfig, MediaTable} from "@/lib/server/types/media-lists.types";
import {and, asc, avgDistinct, count, desc, eq, getTableColumns, gte, inArray, isNotNull, isNull, like, ne, notInArray, SQL, sql} from "drizzle-orm";
import {
    AddedMediaDetails,
    CommonListFilters,
    ConfigTopMetric,
    ExpandedListFilters,
    FilterDefinition,
    FilterDefinitions,
    ItemForNotification,
    JobDetails,
    ListFilterDefinition,
    MediaListArgs,
    MediaListData,
    SimpleMedia,
    UserFollowsMediaData,
    UserMediaStats,
    UserMediaWithLabels,
} from "@/lib/server/types/base.types";


const DEFAULT_PER_PAGE = 25;
const SIMILAR_MAX_GENRES = 12;


export abstract class BaseRepository<TConfig extends MediaSchemaConfig<MediaTable, ListTable, GenreTable, LabelTable>> {
    protected readonly config: TConfig;
    protected readonly baseFilterDefs: FilterDefinitions;

    constructor(config: TConfig) {
        this.config = config;
        this.baseFilterDefs = this.baseListFiltersDefs();
    }

    private baseListFiltersDefs = () => {
        const { listTable, mediaTable, labelTable, genreTable } = this.config;

        return {
            search: {
                isActive: (args: MediaListArgs) => !!args.search,
                getCondition: (args: MediaListArgs) => like(mediaTable.name, `%${args.search}%`),
            },
            status: {
                isActive: (args: MediaListArgs) => isValidFilter(args.status),
                getCondition: (args: MediaListArgs) => inArray(listTable.status, args.status!),
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
                isActive: (args: MediaListArgs) => args.hideCommon === true && args.currentUserId && args.currentUserId !== args.userId,
                getCondition: (args: MediaListArgs) => {
                    const subQuery = getDbClient()
                        .select({ mediaId: listTable.mediaId })
                        .from(listTable)
                        .where(eq(listTable.userId, args.currentUserId!));
                    return notInArray(listTable.mediaId, subQuery);
                },
            },
            labels: createListFilterDef({
                argName: "labels",
                mediaTable: mediaTable,
                entityTable: labelTable,
                filterColumn: labelTable.name,
            }),
            genres: createListFilterDef({
                argName: "genres",
                mediaTable: mediaTable,
                entityTable: genreTable,
                filterColumn: genreTable.name,
            }),
        } as FilterDefinitions;
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

    async findSimilarMedia(mediaId: number): Promise<SimpleMedia[]> {
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

    async getCommonListFilters(userId: number): Promise<CommonListFilters> {
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

    async getUserFavorites(userId: number, limit = 8): Promise<SimpleMedia[]> {
        const { listTable, mediaTable } = this.config;

        return getDbClient()
            .select({
                mediaId: sql<number>`${mediaTable.id}`,
                mediaName: sql<string>`${mediaTable.name}`,
                mediaCover: mediaTable.imageCover,
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

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: any): Promise<TConfig["listTable"]["$inferSelect"]> {
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

        return { ...mainUserMediaData, labels: associatedLabels };
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
        const conditions = [];
        conditions.push(eq(listTable.userId, userId));
        for (const key of Object.keys(allFilters)) {
            const filterDef = allFilters[key as keyof MediaListArgs];
            if (filterDef?.isActive(filterArgs)) {
                const condition = filterDef.getCondition(filterArgs);
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
        const conditions = userId ? [...baseConditions] : [...baseConditions, eq(listTable.userId, userId)];

        return cte.where(and(...conditions))
            .groupBy(listTable.userId)
            .as("calculation");
    }

    // --- Advanced Stats ---------------------------------------------------

    async computeRatingStats(userId?: number) {
        const { listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        const ratingDistrib: { [key: string]: number } = {};
        for (let i = 0; i <= 20; i++) {
            ratingDistrib[(i * 0.5).toFixed(1)] = 0;
        }

        const ratingQuery = await getDbClient()
            .select({
                rating: listTable.rating,
                count: count(listTable.rating),
            })
            .from(listTable)
            .where(and(forUser, isNotNull(listTable.rating)))
            .groupBy(listTable.rating)
            .orderBy(asc(listTable.rating))
            .execute();

        ratingQuery.forEach((result) => {
            const ratingKey = result?.rating?.toFixed(1);
            if (ratingKey) {
                ratingDistrib[ratingKey] = result.count;
            }
        });

        const ratings = Object.entries(ratingDistrib).map(([name, value]) => ({ name, value }));

        return ratings.sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
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

    async computeTopMetricStats(statsConfig: ConfigTopMetric, userId?: number) {
        const { mediaTable, listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;
        const { metricTable, metricIdCol, metricNameCol, mediaLinkCol, filters, limit = 10, minRatingCount = 5 } = statsConfig;
        const isDifferentTable = (metricTable !== mediaTable) && (metricTable !== listTable);

        const countAlias = count(metricNameCol);
        let topValuesBuilder = getDbClient()
            .select({ name: sql<string>`${metricNameCol}`, value: countAlias })
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
            .select({ name: sql<string>`${metricNameCol}`, value: avgRatingAlias })
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
            .select({ name: sql<string>`${metricNameCol}`, value: favoriteCountAlias })
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

        return {
            topValues: topValues.map((row) => ({ name: row.name, value: row.value || 0 })),
            topRated: topRated.map((row) => ({
                name: row.name,
                value: Math.round((Number(row.value) || 0) * 100) / 100,
            })),
            topFavorited: topFavorited.map((row) => ({ name: row.name, value: row.value || 0 })),
        };
    }

    // --- Abstract Methods -----------------------------------------------------------------

    abstract computeAllUsersStats(): Promise<UserMediaStats[]>;

    abstract getMediaToNotify(): Promise<ItemForNotification[]>;

    abstract storeMediaWithDetails(params: any): Promise<number>;

    abstract updateMediaWithDetails(params: any): Promise<boolean>;

    abstract getListFilters(userId: number): Promise<ExpandedListFilters>;

    abstract getSearchListFilters(userId: number, query: string, job: JobType): Promise<{ name: string | null }[]>;

    abstract addMediaToUserList(userId: number, media: any, newStatus: Status): Promise<TConfig["listTable"]["$inferSelect"]>;

    abstract getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit?: number): Promise<JobDetails>;

    abstract findAllAssociatedDetails(mediaId: number): Promise<(TConfig["mediaTable"]["$inferSelect"] & AddedMediaDetails) | undefined>;
}


export const isValidFilter = <T>(value: T) => {
    return Array.isArray(value) && value.length > 0;
}


export const createListFilterDef = ({ argName, entityTable, filterColumn, mediaTable }: ListFilterDefinition) => {
    return {
        isActive: (args: MediaListArgs) => isValidFilter(args[argName]),
        getCondition: (args: MediaListArgs) => {
            const subQuery = getDbClient()
                .select({ mediaId: entityTable.mediaId })
                .from(entityTable)
                .where(inArray(filterColumn, args[argName] as string[]));
            return inArray(mediaTable.id, subQuery);
        },
    } as FilterDefinition;
}
