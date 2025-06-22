import {Status} from "@/lib/server/utils/enums";
import {Achievement} from "@/lib/server/types/achievements";
import {followers, user} from "@/lib/server/database/schema";
import {Label} from "@/lib/components/user-media/LabelsDialog";
import {getDbClient} from "@/lib/server/database/async-storage";
import {IUniversalRepository} from "@/lib/server/types/repositories.types";
import {FilterDefinition, FilterDefinitions, ListFilterDefinition} from "@/lib/server/types/base.types";
import {GenreTable, LabelTable, ListTable, MediaListArgs, MediaSchemaConfig, MediaTable} from "@/lib/server/types/media-lists.types";
import {and, asc, count, desc, eq, getTableColumns, gte, ilike, inArray, isNotNull, isNull, like, ne, notInArray, sql} from "drizzle-orm";


const ALL_VALUE = "All";
const DEFAULT_PER_PAGE = 25;
const SIMILAR_MAX_GENRES = 12;


export interface EditUserLabels {
    label: Label;
    userId: number;
    mediaId: number;
    action: "add" | "rename" | "deleteOne" | "deleteAll";
}


export class BaseRepository<TConfig extends MediaSchemaConfig<MediaTable, ListTable, GenreTable, LabelTable>> implements IUniversalRepository {
    protected readonly config: TConfig;
    protected readonly baseFilterDefs: FilterDefinitions;

    constructor(config: TConfig) {
        this.config = config;
        this.baseFilterDefs = this.baseListFiltersDefs();
    }

    private baseListFiltersDefs = () => {
        const { listTable, mediaTable, genreTable } = this.config;

        return {
            search: {
                isActive: (args: MediaListArgs) => !!args.search,
                getCondition: (args: MediaListArgs) => ilike(mediaTable.name, `%${args.search}%`),
            },
            status: {
                isActive: (args: MediaListArgs) => isValidFilter(args.status),
                getCondition: (args: MediaListArgs) => inArray(listTable.status, args.status!.filter((s: any) => s !== ALL_VALUE)),
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
            genres: createListFilterDef({
                argName: "genres",
                mediaTable: mediaTable,
                entityTable: genreTable,
                filterColumn: genreTable.name,
            }),
        } as FilterDefinitions;
    }

    async findById(mediaId: number | string) {
        const { mediaTable } = this.config;

        return getDbClient()
            .select()
            .from(mediaTable)
            .where(eq(mediaTable.id, mediaId))
            .get()
    }

    async downloadMediaListAsCSV(userId: number) {
        const { mediaTable, listTable } = this.config;

        return getDbClient()
            .select({
                ...getTableColumns(listTable),
                name: mediaTable.name,
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .where(eq(listTable.userId, userId));
    }

    async searchByName(query: string, limit: number = 20) {
        const { mediaTable } = this.config;

        return getDbClient()
            .select({ name: mediaTable.name })
            .from(mediaTable)
            .where(like(mediaTable.name, `%${query}%`))
            .orderBy(mediaTable.name)
            .limit(limit)
            .execute();
    }

    async removeMediaByIds(mediaIds: number[]) {
        const { tablesForDeletion } = this.config;

        for (const table of tablesForDeletion) {
            await getDbClient()
                .delete(table)
                .where(inArray(table.mediaId, mediaIds))
                .execute();
        }
    }

    async getNonListMediaIds() {
        const { mediaTable, listTable } = this.config;

        const mediaToDelete = await getDbClient()
            .select({ id: mediaTable.id })
            .from(mediaTable)
            .leftJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(isNull(listTable.userId))
            .execute();

        return mediaToDelete.map((media) => media.id);
    }

    async getCoverFilenames() {
        const { mediaTable } = this.config;

        return getDbClient()
            .select({ imageCover: mediaTable.imageCover })
            .from(mediaTable)
            .execute()
    }

    async findByApiId(apiId: number | string) {
        const { mediaTable } = this.config;

        return getDbClient()
            .select()
            .from(mediaTable)
            .where(eq(mediaTable.apiId, apiId))
            .get()
    }

    async findSimilarMedia(mediaId: number) {
        const { mediaTable, genreTable } = this.config;

        const targetGenresSubQuery = getDbClient()
            .select({ name: genreTable.name })
            .from(genreTable)
            .where(eq(genreTable.mediaId, mediaId));

        const similarSub = getDbClient()
            .select({ movieId: genreTable.mediaId, commonGenreCount: count(genreTable.name).as("common_genre_count") })
            .from(genreTable)
            .where(and(ne(genreTable.mediaId, mediaId), inArray(genreTable.name, targetGenresSubQuery)))
            .groupBy(genreTable.mediaId)
            .orderBy(desc(sql`common_genre_count`))
            .limit(SIMILAR_MAX_GENRES)
            .as("similar_media");

        const results = getDbClient()
            .select({
                mediaId: mediaTable.id,
                mediaName: mediaTable.name,
                mediaCover: mediaTable.imageCover,
            })
            .from(similarSub)
            .innerJoin(mediaTable, eq(mediaTable.id, similarSub.movieId))
            .orderBy(desc(similarSub.commonGenreCount));

        return results;
    }

    async getUserMediaLabels(userId: number) {
        const { labelTable } = this.config;

        return getDbClient()
            .selectDistinct({ name: labelTable.name })
            .from(labelTable)
            .where(eq(labelTable.userId, userId))
            .orderBy(asc(labelTable.name));
    }

    async editUserLabel({ userId, label, mediaId, action }: EditUserLabels) {
        const { labelTable } = this.config;

        if (action === "add") {
            const [labelData] = await getDbClient()
                .insert(labelTable)
                .values({ userId, name: label.name, mediaId })
                .returning({ name: labelTable.name })
            return labelData as Label;
        }
        else if (action === "rename") {
            const [labelData] = await getDbClient()
                .update(labelTable)
                .set({ name: label.name })
                .where(and(eq(labelTable.userId, userId), eq(labelTable.name, label?.oldName)))
                .returning({ name: labelTable.name })
            return labelData as Label;
        }
        else if (action === "deleteOne") {
            await getDbClient()
                .delete(labelTable)
                .where(and(eq(labelTable.userId, userId), eq(labelTable.name, label.name), eq(labelTable.mediaId, mediaId)))
                .execute();
        }
        else if (action === "deleteAll") {
            await getDbClient()
                .delete(labelTable)
                .where(and(eq(labelTable.userId, userId), eq(labelTable.name, label.name)))
                .execute();
        }
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

    async getUserFavorites(userId: number, limit = 8) {
        const { listTable, mediaTable } = this.config;

        return getDbClient()
            .select({
                mediaId: mediaTable.id,
                mediaName: mediaTable.name,
                mediaCover: mediaTable.imageCover,
            })
            .from(listTable)
            .where(and(eq(listTable.userId, userId), eq(listTable.favorite, true)))
            .leftJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .limit(limit)
    }

    async findUserMedia(userId: number, mediaId: number) {
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
            .select({ name: labelTable.name })
            .from(labelTable)
            .where(and(eq(labelTable.mediaId, mediaId), eq(labelTable.userId, userId)))
            .orderBy(asc(labelTable.name))
            .execute();

        if (!mainUserMediaData && !associatedLabels) {
            return null;
        }

        return { ...mainUserMediaData, labels: associatedLabels };
    }

    async getUserFollowsMediaData(userId: number, mediaId: number) {
        const { listTable } = this.config;

        const inFollowsLists = await getDbClient()
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                mediaList: listTable,
                ratingSystem: user.ratingSystem,
            })
            .from(followers)
            .innerJoin(user, eq(user.id, followers.followedId))
            .innerJoin(listTable, eq(listTable.userId, followers.followedId))
            .where(and(eq(followers.followerId, userId), eq(listTable.mediaId, mediaId)));

        return inFollowsLists;
    }

    async getCommonListFilters(userId: number) {
        const { genreTable, labelTable, listTable } = this.config;

        const genresPromise = getDbClient()
            .selectDistinct({ name: genreTable.name })
            .from(genreTable)
            .innerJoin(listTable, eq(listTable.mediaId, genreTable.mediaId))
            .where(eq(listTable.userId, userId))
            .orderBy(asc(genreTable.name));

        const labelsPromise = getDbClient()
            .selectDistinct({ name: labelTable.name })
            .from(labelTable)
            .where(and(eq(labelTable.userId, userId)))
            .orderBy(asc(labelTable.name));

        const results = await Promise.all([genresPromise, labelsPromise]);

        return { genres: results[0] || [], labels: results[1] || [] } as { genres: { name: string }[], labels: { name: string }[] };
    }

    async getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs) {
        const { listTable, mediaTable, mediaList } = this.config;

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
                condition ?? conditions.push(condition);
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

    applyWhereConditionsAndGrouping(cte: any, baseConditions: any[], userId?: number) {
        const { listTable } = this.config;

        const conditions = [...baseConditions];
        if (userId) {
            conditions.push(eq(listTable.userId, userId));
        }

        return cte.where(and(...conditions)).groupBy(listTable.userId).as("calculation");
    }

    countCompletedAchievementCte(_achievement: Achievement, userId?: number) {
        const { listTable } = this.config;

        let baseCTE = getDbClient()
            .select({
                userId: listTable.userId,
                value: count(listTable.mediaId).as("value"),
            }).from(listTable);

        const conditions = [eq(listTable.status, Status.COMPLETED)]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    countRatedAchievementCte(_achievement: Achievement, userId?: number) {
        const { listTable } = this.config;

        let baseCTE = getDbClient()
            .select({
                userId: listTable.userId,
                value: count(listTable.mediaId).as("value"),
            }).from(listTable);

        const conditions = [isNotNull(listTable.rating)]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

    countCommentedAchievementCte(_achievement: Achievement, userId?: number) {
        const { listTable } = this.config;

        let baseCTE = getDbClient()
            .select({
                userId: listTable.userId,
                value: count(listTable.mediaId).as("value"),
            }).from(listTable);

        const conditions = [isNotNull(listTable.comment)]

        return this.applyWhereConditionsAndGrouping(baseCTE, conditions, userId);
    }

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

        const releaseDates = await getDbClient()
            .select({
                name: sql<number>`floor(extract(year from ${mediaTable.releaseDate}) / 10.0) * 10`,
                value: sql<number>`cast(count(${mediaTable.releaseDate}) as int)`.as("count"),
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(forUser, isNotNull(mediaTable.releaseDate)))
            .groupBy(sql<number>`floor(extract(year from ${mediaTable.releaseDate}) / 10.0) * 10`)
            .orderBy(asc(sql<number>`floor(extract(year from ${mediaTable.releaseDate}) / 10.0) * 10`))
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
            metricNameColumn: genreTable.name,
            metricIdColumn: genreTable.mediaId,
            mediaLinkColumn: listTable.mediaId,
            filters: [notInArray(listTable.status, [Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ])],
        };

        return this.computeTopMetricStats(metricStatsConfig, userId);
    }

    async computeTopMetricStats(statsConfig: Record<string, any>, userId?: number) {
        const { mediaTable, listTable } = this.config;
        const forUser = userId ? eq(listTable.userId, userId) : undefined;

        const limit = statsConfig?.limit ?? 10;
        const minRatingCount = statsConfig?.minRatingCount ?? 5;
        const { metricTable, metricIdColumn, metricNameColumn, mediaLinkColumn, filters } = statsConfig;

        const countAlias = sql<number>`countDistinct(${metricNameColumn})`
        const topValuesQuery = getDbClient()
            .select({
                name: metricNameColumn,
                value: countAlias,
            })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .innerJoin(metricTable, eq(mediaLinkColumn, metricIdColumn))
            .where(and(forUser, isNotNull(metricNameColumn), ...filters))
            .groupBy(metricNameColumn)
            .orderBy(asc(countAlias))
            .limit(limit)

        const avgRatingAlias = sql<number>`avgDistinct(${metricNameColumn})`;
        const ratingCountAlias = sql<number>`count(${listTable.rating})`;
        const topRatedQuery = getDbClient()
            .select({ name: metricNameColumn, value: avgRatingAlias })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .innerJoin(metricTable, eq(mediaLinkColumn, metricIdColumn))
            .where(and(forUser, isNotNull(metricNameColumn), isNotNull(listTable.rating), ...filters))
            .groupBy(metricNameColumn)
            .having(gte(ratingCountAlias, minRatingCount))
            .orderBy(asc(avgRatingAlias))
            .limit(limit);

        const topFavoritedQuery = getDbClient()
            .select({ name: metricNameColumn, value: countAlias })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .innerJoin(metricTable, eq(mediaLinkColumn, metricIdColumn))
            .where(and(forUser, isNotNull(metricNameColumn), eq(listTable.favorite, true), ...filters))
            .groupBy(metricNameColumn)
            .orderBy(asc(countAlias))
            .limit(limit);

        const [topValuesResult, topRatedResult, topFavoritedResult] =
            await Promise.all([topValuesQuery.execute(), topRatedQuery.execute(), topFavoritedQuery.execute()]);

        return {
            topValues: topValuesResult.map((row: any) => ({
                name: row.name,
                value: Number(row.value) || 0,
            })),
            topRated: topRatedResult.map((row: any) => ({
                name: row.name,
                value: Math.round((Number(row.value) || 0) * 100) / 100,
            })),
            topFavorited: topFavoritedResult.map((row: any) => ({
                name: row.name,
                value: Number(row.value) || 0,
            })),
        };
    }
}


export const isValidFilter = (value: any) => {
    return Array.isArray(value) && value.length > 0 && value[0] !== ALL_VALUE;
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
