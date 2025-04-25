import {Status} from "@/lib/server/utils/enums";
import {followers, user} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/asyncStorage";
import {Label} from "@/lib/components/user-media/LabelsDialog";
import {FilterDefinitions} from "@/lib/server/types/base.types";
import {MediaSchemaConfig} from "@/lib/server/types/media-lists.types";
import {and, asc, count, desc, eq, gte, inArray, isNotNull, like, ne, notInArray, sql} from "drizzle-orm";


const ALL_VALUE = "All";
const DEFAULT_PER_PAGE = 25;
const SIMILAR_MAX_GENRES = 12;


export interface EditUserLabels {
    label: Label;
    userId: number;
    mediaId: number;
    action: "add" | "rename" | "deleteOne" | "deleteAll";
}


export class BaseRepository<TConfig extends MediaSchemaConfig<any, any, any, any>
> {
    protected readonly config: TConfig;
    protected readonly baseFilterDefinitions: FilterDefinitions;
    protected readonly specificFilterDefinitions: FilterDefinitions;

    constructor(config: TConfig, specificFilterFactory?: (config: TConfig) => FilterDefinitions,
    ) {
        this.config = config;
        this.baseFilterDefinitions = this.createBaseFilterDefinitions();
        this.specificFilterDefinitions = specificFilterFactory ? specificFilterFactory(this.config) : {};
    }

    protected createBaseFilterDefinitions = () => {
        const { listTable, mediaTable, genreConfig } = this.config;

        return {
            search: {
                isActive: (args: any) => !!args.search,
                getCondition: (args: any) => like(mediaTable.name, `%${args.search}%`),
            },
            status: {
                isActive: (args: any) => isValidFilter(args.status),
                getCondition: (args: any) => inArray(listTable.status, args.status!.filter((s: any) => s !== ALL_VALUE)),
            },
            favorite: {
                isActive: (args: any) => args.favorite === true,
                getCondition: (_args: any) => eq(listTable.favorite, true),
            },
            comment: {
                isActive: (args: any) => args.comment === true,
                getCondition: (_args: any) => isNotNull(listTable.comment),
            },
            hideCommon: {
                isActive: (args: any) => args.hideCommon === true && args.currentUserId && args.currentUserId !== args.userId,
                getCondition: (args: any) => {
                    const subQuery = getDbClient()
                        .select({ mediaId: listTable.mediaId })
                        .from(listTable)
                        .where(eq(listTable.userId, args.currentUserId!));
                    return notInArray(listTable.mediaId, subQuery);
                },
            },
            genres: {
                isActive: (args: any) => isValidFilter(args.genres),
                applyJoin: (qb: any, _args: any) => {
                    if (!genreConfig) throw new Error("Genre config missing");
                    return applyJoin(qb, genreConfig);
                },
                getCondition: (args: any) => {
                    if (!genreConfig) throw new Error("Genre config missing");
                    return inArray(genreConfig.filterColumnInEntity, args.genres!);
                },
            },
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

        const results = await getDbClient()
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

        const mainUserMediaData = getDbClient()
            .select({ ...listTable, ratingSystem: user.ratingSystem })
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

        return { genres: results[0] || [], labels: results[1] || [] };
    }

    async getTotalMediaLabel(userId: number) {
        const { labelTable } = this.config;

        const result = getDbClient()
            .selectDistinct({ count: count(labelTable.name) })
            .from(labelTable)
            .where(eq(labelTable.userId, userId))
            .get();

        return result?.count ?? 0;
    }

    async getMediaList(currentUserId: number | undefined, userId: number, args: any) {
        const page = args.page ?? 1;
        const perPage = args.perPage ?? DEFAULT_PER_PAGE;
        const offset = (page - 1) * perPage;

        const { listTable, mediaTable, baseSelection, availableSorts, defaultSortName } = this.config;

        const sortKeyName = args.sort ? args.sort : defaultSortName;
        const selectedSort = availableSorts[sortKeyName];
        const filterArgs = { ...args, currentUserId, userId };

        const allFilters = { ...this.baseFilterDefinitions, ...this.specificFilterDefinitions };

        // Main query builder
        let queryBuilder = getDbClient()
            .select(baseSelection)
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();

        // Count query builder
        let countQueryBuilder = getDbClient()
            .select({ count: count() })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();

        // Apply Filters
        const conditions = [];
        conditions.push(eq(listTable.userId, userId));

        // Iterate through all given filters
        for (const key of Object.keys(allFilters)) {
            const filterDef = allFilters[key];
            if (filterDef.isActive(filterArgs)) {
                if (filterDef.applyJoin) {
                    queryBuilder = filterDef.applyJoin(queryBuilder, filterArgs);
                    countQueryBuilder = filterDef.applyJoin(countQueryBuilder, filterArgs);
                }
                const condition = filterDef.getCondition(filterArgs);
                if (condition) {
                    conditions.push(condition);
                }
            }
        }

        const finalCondition = and(...conditions);
        queryBuilder = queryBuilder.where(finalCondition);
        countQueryBuilder = countQueryBuilder.where(finalCondition);

        const finalQuery = queryBuilder
            .orderBy(...(Array.isArray(selectedSort) ? selectedSort : [selectedSort]))
            .limit(perPage)
            .offset(offset);

        const [results, totalResult] = await Promise.all([finalQuery.execute(), countQueryBuilder.execute()]);

        const totalItems = totalResult[0]?.count ?? 0;
        const totalPages = Math.ceil(totalItems / perPage);

        // Fetch common IDs (if needed and not filtered out)
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
                availableSorting: Object.keys(availableSorts),
                sorting: sortKeyName,
            },
        };
    }

    async topMetricStatsQueries(userId: number, statsConfig: Record<string, any>) {
        const limit = statsConfig?.limit ?? 10;
        const { mediaTable, listTable } = this.config;
        const minRatingCount = statsConfig?.minRatingCount ?? 5;
        const { metricTable, metricIdColumn, metricNameColumn, mediaLinkColumn, statusFilters } = statsConfig;

        const countAlias = sql<number>`countDistinct(${metricNameColumn})`
        const topValuesQuery = getDbClient()
            .select({ name: metricNameColumn, value: countAlias })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .innerJoin(metricTable, eq(mediaLinkColumn, metricIdColumn))
            .where(and(
                eq(listTable.userId, userId), isNotNull(metricNameColumn),
                notInArray(listTable.status, statusFilters)
            ))
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
            .where(and(
                eq(listTable.userId, userId), isNotNull(metricNameColumn),
                isNotNull(listTable.rating), notInArray(listTable.status, statusFilters),
            ))
            .groupBy(metricNameColumn)
            .having(gte(ratingCountAlias, minRatingCount))
            .orderBy(asc(avgRatingAlias))
            .limit(limit);

        const topFavoritedQuery = getDbClient()
            .select({ name: metricNameColumn, value: countAlias })
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .innerJoin(metricTable, eq(mediaLinkColumn, metricIdColumn))
            .where(and(
                eq(listTable.userId, userId), isNotNull(metricNameColumn),
                eq(listTable.isFavorite, true), notInArray(listTable.status, statusFilters),
            ))
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

    async computeRatingStats(userId: number) {
        const { listTable } = this.config;

        const ratingDistribution: { [key: string]: number } = {};
        for (let i = 0; i <= 20; i++) {
            ratingDistribution[(i * 0.5).toFixed(1)] = 0;
        }

        const ratingQuery = await getDbClient()
            .select({ rating: listTable.rating, count: count(listTable.rating) })
            .from(listTable)
            .where(and(eq(listTable.userId, userId), isNotNull(listTable.rating)))
            .groupBy(listTable.rating)
            .orderBy(asc(listTable.rating))
            .execute();

        ratingQuery.forEach((result) => {
            const ratingKey = result?.rating?.toFixed(1);
            if (ratingKey) ratingDistribution[ratingKey] = result.count;
        });

        const ratings = Object.entries(ratingDistribution).map(([name, value]) => ({ name, value }));
        return ratings.sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
    }

    async computeReleaseDateStats(userId: number) {
        const { mediaTable, listTable } = this.config;

        const releaseDates = await getDbClient()
            .select({
                name: sql<number>`floor(extract(year from ${mediaTable.releaseDate}) / 10.0) * 10`,
                value: sql<number>`cast(count(${mediaTable.releaseDate}) as int)`.as("count"),
            })
            .from(mediaTable)
            .innerJoin(listTable, eq(listTable.mediaId, mediaTable.id))
            .where(and(eq(listTable.userId, userId), isNotNull(mediaTable.releaseDate)))
            .groupBy(sql<number>`floor(extract(year from ${mediaTable.releaseDate}) / 10.0) * 10`)
            .orderBy(asc(sql<number>`floor(extract(year from ${mediaTable.releaseDate}) / 10.0) * 10`))
            .execute();

        return releaseDates;
    }

    async computeGenresStats(userId: number) {
        const { genreTable, listTable } = this.config;

        const metricStatsConfig = {
            metricTable: genreTable,
            metricNameColumn: genreTable.name,
            metricIdColumn: genreTable.mediaId,
            mediaLinkColumn: listTable.mediaId,
            statusFilters: [Status.PLAN_TO_WATCH],
        };

        return await this.topMetricStatsQueries(userId, metricStatsConfig);
    }
}


export const isValidFilter = <T>(value: T[] | undefined): value is T[] => {
    return Array.isArray(value) && value.length > 0 && value[0] !== ALL_VALUE;
}


export const applyJoin = (qb: any, config: any) => {
    return qb.innerJoin(config.entityTable, eq(config.mediaIdColumnInEntity, config.idColumnInMedia));
}
