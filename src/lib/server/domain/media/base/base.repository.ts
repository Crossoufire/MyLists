import {db} from "@/lib/server/database/db";
import {followers, user} from "@/lib/server/database/schema";
import {FilterDefinitions} from "@/lib/server/types/base.types";
import {MediaSchemaConfig} from "@/lib/server/types/media-lists.types";
import {and, asc, count, desc, eq, inArray, isNotNull, like, ne, notInArray, sql} from "drizzle-orm";


const ALL_VALUE = "All";
const DEFAULT_PER_PAGE = 25;
const SIMILAR_MAX_GENRES = 12;


export class BaseRepository<TConfig extends MediaSchemaConfig<any, any, any, any>> {
    protected readonly config: TConfig;
    protected readonly baseFilterDefinitions: FilterDefinitions;
    protected readonly specificFilterDefinitions: FilterDefinitions;

    constructor(config: TConfig, specificFilterFactory?: (config: TConfig) => FilterDefinitions) {
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
                    const subQuery = db
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

    async findById(mediaId: number) {
        const { mediaTable } = this.config;
        return db
            .select()
            .from(mediaTable)
            .where(eq(mediaTable.id, mediaId))
            .limit(1)
            .then((results) => results[0] ?? null);
    }

    async findByApiId(apiId: number) {
        const { mediaTable } = this.config;

        return db.select().from(mediaTable)
            .where(eq(mediaTable.apiId, apiId))
            .limit(1)
            .then((results) => results[0] ?? null);
    }

    async findSimilarMedia(mediaId: number) {
        const { mediaTable, genreTable } = this.config;

        const targetGenresSubQuery = db
            .select({ name: genreTable.name })
            .from(genreTable)
            .where(eq(genreTable.mediaId, mediaId));

        const similarSubQuery = db
            .select({ movieId: genreTable.mediaId, commonGenreCount: count(genreTable.name).as("common_genre_count") })
            .from(genreTable)
            .where(and(ne(genreTable.mediaId, mediaId), inArray(genreTable.name, targetGenresSubQuery)))
            .groupBy(genreTable.mediaId)
            .orderBy(desc(sql`common_genre_count`))
            .limit(SIMILAR_MAX_GENRES)
            .as("similar_media");

        const results = await db
            .select({
                mediaId: mediaTable.id,
                mediaName: mediaTable.name,
                mediaCover: mediaTable.imageCover,
                commonGenreCount: similarSubQuery.commonGenreCount,
            })
            .from(similarSubQuery)
            .innerJoin(mediaTable, eq(mediaTable.id, similarSubQuery.movieId))
            .orderBy(desc(similarSubQuery.commonGenreCount));

        return results;

    }

    async getUserFavorites(userId: number, limit = 8) {
        const { listTable, mediaTable } = this.config;

        return db
            .select({
                mediaId: mediaTable.id,
                mediaName: mediaTable.name,
                mediaCover: mediaTable.imageCover,
            })
            .from(listTable)
            .where(and(eq(listTable.userId, userId), eq(listTable.favorite, true)))
            .leftJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .limit(limit);
    }

    async findUserMedia(userId: number, mediaId: number) {
        const { listTable, labelTable } = this.config;

        const mainUserMediaData = await db
            .select().from(listTable)
            .where(and(eq(listTable.userId, userId), eq(listTable.mediaId, mediaId)))
            .limit(1)
            .then((results) => results[0] ?? null);

        if (!mainUserMediaData) return null;

        const associatedLabels = await db
            .select({
                id: labelTable.id,
                name: labelTable.name,
            }).from(labelTable)
            .where(and(eq(labelTable.mediaId, mediaId), eq(labelTable.userId, userId)))
            .orderBy(asc(labelTable.name))
            .execute();

        return { ...mainUserMediaData, labels: associatedLabels };
    }

    async getUserFollowsMediaData(userId: number, mediaId: number) {
        const { listTable } = this.config;

        const inFollowsLists = await db
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                mediaList: listTable,
            })
            .from(followers)
            .innerJoin(user, eq(user.id, followers.followedId))
            .innerJoin(listTable, eq(listTable.userId, followers.followedId))
            .where(and(eq(followers.followerId, userId), eq(listTable.mediaId, mediaId)));

        return inFollowsLists;
    }

    async getCommonListFilters(userId: number) {
        const { genreTable, labelTable, listTable } = this.config;

        const genresPromise = db
            .selectDistinct({ name: genreTable.name })
            .from(genreTable)
            .innerJoin(listTable, eq(listTable.mediaId, genreTable.mediaId))
            .where(eq(listTable.userId, userId))
            .orderBy(asc(genreTable.name));

        const labelsPromise = db
            .selectDistinct({ name: labelTable.name })
            .from(labelTable)
            .where(and(eq(labelTable.userId, userId)))
            .orderBy(asc(labelTable.name));

        const results = await Promise.all([genresPromise, labelsPromise]);

        return { genres: results[0] || [], labels: results[1] || [] };
    }

    async getTotalMediaLabel(userId: number) {
        const { labelTable } = this.config;

        const result = await db
            .selectDistinct({ count: count(labelTable.name) })
            .from(labelTable)
            .where(eq(labelTable.userId, userId));

        return result[0]?.count ?? 0;
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
        let queryBuilder = db
            .select(baseSelection)
            .from(listTable)
            .innerJoin(mediaTable, eq(listTable.mediaId, mediaTable.id))
            .$dynamic();

        // Count query builder
        let countQueryBuilder = db
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
            const commonMediaIdsResult = await db
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
}


export const isValidFilter = <T>(value: T[] | undefined): value is T[] => {
    return Array.isArray(value) && value.length > 0 && value[0] !== ALL_VALUE;
}


export const applyJoin = (qb: any, config: any) => {
    return qb.innerJoin(config.entityTable, eq(config.mediaIdColumnInEntity, config.idColumnInMedia));
}
