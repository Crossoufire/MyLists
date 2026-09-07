import {TagAction} from "@/lib/utils/enums";
import type {SimpleSearch} from "@/lib/schemas";
import type {Tag} from "@/lib/types/media-common.types";
import {FormattedError} from "@/lib/utils/error-classes";
import {getDbClient} from "@/lib/server/database/async-storage";
import {resolvePagination} from "@/lib/server/database/pagination";
import {and, asc, countDistinct, desc, eq, like, lte, sql} from "drizzle-orm";
import type {AnyMediaRepositoryDefinition} from "@/lib/media-definitions/base/media.definition.server";


export const createMediaTagQueries = (definition: AnyMediaRepositoryDefinition) => {
    const { listTable, mediaTable, tagTable } = definition.tables;

    return {
        async getTagNames(userId: number) {
            return getDbClient()
                .selectDistinct({ name: sql<string>`${tagTable.name}` })
                .from(tagTable)
                .where(eq(tagTable.userId, userId))
                .orderBy(asc(tagTable.name));
        },

        editUserTag(userId: number, tag: Tag, action: TagAction, mediaId?: number) {
            const db = getDbClient();

            if (action === TagAction.ADD) {
                const [tagData] = db
                    .insert(tagTable)
                    .values({ userId, name: tag.name, mediaId })
                    .returning({ name: tagTable.name }).all();

                return tagData satisfies Tag;
            }
            else if (action === TagAction.RENAME) {
                if (!tag.oldName) return;

                const existingTag = db
                    .select()
                    .from(tagTable)
                    .where(and(eq(tagTable.userId, userId), eq(tagTable.name, tag.name)))
                    .get();

                if (existingTag) {
                    throw new FormattedError("A tag with this name already exists.");
                }

                const [tagData] = db
                    .update(tagTable)
                    .set({ name: tag.name })
                    .where(and(
                        eq(tagTable.userId, userId),
                        eq(tagTable.name, tag.oldName)
                    )).returning({ name: tagTable.name }).all();
                return tagData satisfies Tag;
            }
            else if (action === TagAction.DELETE_ONE) {
                if (!mediaId) return;

                db
                    .delete(tagTable)
                    .where(and(eq(tagTable.userId, userId), eq(tagTable.name, tag.name), eq(tagTable.mediaId, mediaId))).run();
            }
            else if (action === TagAction.DELETE_ALL) {
                db
                    .delete(tagTable)
                    .where(and(eq(tagTable.userId, userId), eq(tagTable.name, tag.name))).run();
            }
        },

        async getTagsView(userId: number, search: SimpleSearch) {
            const pagination = resolvePagination({ page: search.page, perPage: 16, maxPerPage: 16 });
            const searchCondition = search.search ? like(tagTable.name, `%${search.search}%`) : undefined;

            const rankedSq = getDbClient()
                .$with("ranked_data")
                .as(getDbClient()
                    .select({
                        tagId: tagTable.id,
                        mediaId: listTable.mediaId,
                        mediaCover: mediaTable.imageCover,
                        tagName: sql<string>`${tagTable.name}`.as("tag_name"),
                        mediaName: sql<string>`${mediaTable.name}`.as("media_name"),
                        rowNumber: sql<number>`row_number() over (
                            partition by ${tagTable.name}
                            order by ${listTable.lastUpdated} desc
                        )`.as("row_number"),
                        totalCount: sql<number>`count(${tagTable.mediaId}) over (
                            partition by ${tagTable.name}
                        )`.as("total_count"),
                        tagLastActivity: sql<number>`max(${listTable.lastUpdated}) over (
                            partition by ${tagTable.name}
                        )`.as("tags_last_activity"),
                    })
                    .from(tagTable)
                    .leftJoin(mediaTable, eq(tagTable.mediaId, mediaTable.id))
                    .leftJoin(listTable, and(eq(tagTable.mediaId, listTable.mediaId), eq(listTable.userId, userId)))
                    .where(and(eq(tagTable.userId, userId), searchCondition))
                );

            const [{ total, exactMatch }, items] = await Promise.all([
                getDbClient()
                    .select({
                        total: countDistinct(tagTable.name),
                        exactMatch: search.search
                            ? sql<number>`max(case when lower(${tagTable.name}) = lower(${search.search}) then 1 else 0 end)`
                            : sql<number>`0`,
                    })
                    .from(tagTable)
                    .where(and(eq(tagTable.userId, userId), searchCondition))
                    .then(([result]) => result),
                getDbClient()
                    .with(rankedSq)
                    .select({
                        tagId: rankedSq.tagId,
                        tagName: rankedSq.tagName,
                        totalCount: rankedSq.totalCount,
                        medias: sql<{ mediaId: number; mediaName: string; mediaCover: string }[]>`
                            json_group_array(json_object(
                                'mediaId', ${rankedSq.mediaId},
                                'mediaName', ${rankedSq.mediaName},
                                'mediaCover', ${rankedSq.mediaCover}
                            ))`.mapWith((rawString) => {
                            const parsedArray = JSON.parse(rawString);
                            return parsedArray.filter((item: any) => item.mediaId !== null).map((item: any) => ({
                                ...item,
                                mediaCover: mediaTable.imageCover.mapFromDriverValue(item.mediaCover),
                            }))
                        }),
                    })
                    .from(rankedSq)
                    .where(lte(rankedSq.rowNumber, 3))
                    .groupBy(sql`${rankedSq.tagName}`)
                    .orderBy(desc(rankedSq.tagLastActivity))
                    .limit(pagination.limit)
                    .offset(pagination.offset),
            ]);

            return {
                total,
                items: items,
                page: pagination.page,
                exactMatch: !!exactMatch,
                perPage: pagination.perPage,
                pages: Math.ceil(total / pagination.perPage),
            };
        },
    };
};
