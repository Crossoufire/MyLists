import {Status} from "@/lib/utils/enums";
import {user} from "@/lib/server/database/schema";
import {EpsPerSeasonType} from "@/lib/types/media-list.types";
import {AddedMediaDetails} from "@/lib/types/media-common.types";
import type {TvSeasonState} from "@/lib/schemas/tv-seasons.schema";
import {StatsRepository} from "@/lib/server/domain/stats/stats.repository";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {getDbClient, withTransaction} from "@/lib/server/database/async-storage";
import {attachTvSeasonEpisodes, getTvSeasonTotals} from "@/lib/utils/media/tv-seasons";
import {AnimeServerDefinition} from "@/lib/media-definitions/tv/anime/anime.definition.server";
import {SeriesServerDefinition} from "@/lib/media-definitions/tv/series/series.definition.server";
import {TvType, UpdateTvWithDetails, UpsertTvWithDetails} from "@/lib/server/domain/media/tv/tv.types";
import {and, asc, eq, getTableColumns, gte, inArray, isNotNull, isNull, lte, max, notInArray, or, sql} from "drizzle-orm";


type TvDefinition = AnimeServerDefinition | SeriesServerDefinition;


export class TvRepository extends BaseRepository<TvDefinition> {
    constructor(definition: TvDefinition) {
        super(definition);
    }

    override async bulkInsertUserMedia(rows: (TvDefinition["repository"]["tables"]["listTable"]["$inferInsert"] & { seasons?: TvSeasonState[] })[]) {
        const { listTable } = this.repoDefinition.tables;

        return withTransaction(() => {
            const inserted = [];
            for (const { seasons, ...row } of rows) {
                const metadata = this.getMediaEpsPerSeason(row.mediaId);
                const states = seasons ?? metadata.map(s => ({ season: s.season, redo: 0, rating: row.rating ?? null }));

                const totals = getTvSeasonTotals(attachTvSeasonEpisodes(states, metadata));

                const saved = getDbClient()
                    .insert(listTable)
                    .values({ ...row, rating: totals.rating, redo: totals.redo })
                    .onConflictDoNothing({ target: [listTable.userId, listTable.mediaId] })
                    .returning()
                    .get();

                if (!saved) continue;

                this.insertSeasonStates(saved.id, states);
                inserted.push(saved);
            }

            return inserted;
        });
    }

    override async downloadMediaListAsCSV(userId: number) {
        const { listTable, seasonStateTable } = this.repoDefinition.tables;

        const rows = await super.downloadMediaListAsCSV(userId);

        const seasons = getDbClient()
            .select({
                redo: seasonStateTable.redo, rating: seasonStateTable.rating,
                listId: seasonStateTable.listId, season: seasonStateTable.season,
            }).from(seasonStateTable)
            .innerJoin(listTable, eq(listTable.id, seasonStateTable.listId))
            .where(eq(listTable.userId, userId))
            .orderBy(asc(seasonStateTable.season))
            .all();

        const byList = new Map<number, TvSeasonState[]>();

        for (const { listId, ...season } of seasons) {
            const list = byList.get(listId) ?? [];
            list.push(season);
            byList.set(listId, list);
        }

        return rows?.map(row => ({ ...row, seasons: JSON.stringify(byList.get(row.id) ?? []) }));
    }

    getUserSeasons(userId: number, mediaId: number) {
        const { listTable, seasonStateTable, epsPerSeasonTable } = this.repoDefinition.tables;

        return getDbClient()
            .select({
                redo: seasonStateTable.redo,
                rating: seasonStateTable.rating,
                season: seasonStateTable.season,
                episodes: epsPerSeasonTable.episodes,
            }).from(seasonStateTable)
            .innerJoin(listTable, eq(listTable.id, seasonStateTable.listId))
            .leftJoin(epsPerSeasonTable, and(
                eq(epsPerSeasonTable.mediaId, listTable.mediaId),
                eq(epsPerSeasonTable.season, seasonStateTable.season),
            ))
            .where(and(eq(listTable.userId, userId), eq(listTable.mediaId, mediaId)))
            .orderBy(asc(seasonStateTable.season))
            .all();
    }

    insertSeasonStates(listId: number, seasons: TvSeasonState[]) {
        const { seasonStateTable } = this.repoDefinition.tables;

        if (!seasons.length) return;

        return getDbClient()
            .insert(seasonStateTable)
            .values(seasons.map(s => ({ ...s, listId })))
            .onConflictDoNothing()
            .run();
    }

    updateSeasonState(listId: number, season: number, changes: Partial<Pick<TvSeasonState, "redo" | "rating">>) {
        const { seasonStateTable } = this.repoDefinition.tables;

        return getDbClient()
            .update(seasonStateTable)
            .set(changes)
            .where(and(eq(seasonStateTable.listId, listId), eq(seasonStateTable.season, season)))
            .run();
    }

    resetSeasonRedos(listId: number) {
        const { seasonStateTable } = this.repoDefinition.tables;

        return getDbClient()
            .update(seasonStateTable)
            .set({ redo: 0 })
            .where(eq(seasonStateTable.listId, listId))
            .run();
    }

    getMediaEpsPerSeason(mediaId: number) {
        const { epsPerSeasonTable } = this.repoDefinition.tables;

        return getDbClient()
            .select({
                season: epsPerSeasonTable.season,
                episodes: epsPerSeasonTable.episodes,
            })
            .from(epsPerSeasonTable)
            .where(eq(epsPerSeasonTable.mediaId, mediaId))
            .orderBy(asc(epsPerSeasonTable.season)).all();
    }

    async getMediaIdsToBeRefreshed(apiIds: number[]) {
        const { mediaTable } = this.repoDefinition.tables;
        const staleAfter = `-${this.ingestion.refresh.staleAfterDays} days`;

        const airedCondition = and(
            isNotNull(mediaTable.nextEpisodeToAir),
            lte(mediaTable.nextEpisodeToAir, sql`date('now')`),
        );

        const staleListCondition = apiIds.length > 0
            ? and(inArray(mediaTable.apiId, apiIds), lte(mediaTable.lastApiUpdate, sql`datetime('now', ${staleAfter})`))
            : undefined;

        const refreshCriteria = staleListCondition ? or(staleListCondition, airedCondition) : airedCondition;

        return getDbClient()
            .select({ apiId: mediaTable.apiId })
            .from(mediaTable)
            .where(and(or(eq(mediaTable.lockStatus, false), isNull(mediaTable.lockStatus)), refreshCriteria))
            .then((res) => res.map((m) => m.apiId));
    }

    // --- Implemented Methods ------------------------------------------------

    async getUpcomingMedia(userId?: number, maxAWeek?: boolean) {
        const { mediaTable, listTable, epsPerSeasonTable } = this.repoDefinition.tables;

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
                gte(mediaTable.nextEpisodeToAir, sql`date('now')`),
                maxAWeek ? lte(mediaTable.nextEpisodeToAir, sql`date('now', '+7 days')`) : undefined,
            ))
            .orderBy(asc(mediaTable.nextEpisodeToAir));
    }

    addMediaToUserList(userId: number, media: TvType, newStatus: Status) {
        const { listTable } = this.repoDefinition.tables;
        const epsPerSeason = this.getMediaEpsPerSeason(media.id);

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

        const [newMedia] = getDbClient()
            .insert(listTable)
            .values({
                userId,
                total: newTotal,
                mediaId: media.id,
                status: newStatus,
                currentSeason: newSeason,
                currentEpisode: newEpisode,
            })
            .returning().all();

        this.insertSeasonStates(newMedia.id, epsPerSeason.map(s => ({ season: s.season, redo: 0, rating: null })));
        return newMedia;
    }

    async findAllAssociatedDetails(mediaId: number) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.repoDefinition.tables;

        const details = getDbClient()
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
            providerData: {
                name: this.attribution.name,
                url: `${this.attribution.mediaUrl}${details.apiId}`,
            },
            genres: details.genres || [],
            actors: details.actors || [],
            networks: details.networks || [],
            epsPerSeason: details.epsPerSeason || [],
        };

        return result;
    }

    storeMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData }: UpsertTvWithDetails) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.repoDefinition.tables;

        const tx = getDbClient();

        const [media] = tx
            .insert(mediaTable)
            .values({
                ...mediaData,
                lastApiUpdate: sql`datetime('now')`,
            })
            .onConflictDoUpdate({
                target: mediaTable.apiId,
                set: { lastApiUpdate: sql`datetime('now')` },
            })
            .returning().all();

        const mediaId = media.id;
        if (actorsData && actorsData.length > 0) {
            const actorsToAdd = actorsData.map((a) => ({ mediaId, ...a }));
            tx.insert(actorTable).values(actorsToAdd).onConflictDoNothing().run();
        }

        if (genresData && genresData.length > 0) {
            const genresToAdd = genresData.map((g) => ({ mediaId, ...g }));
            tx.insert(genreTable).values(genresToAdd).onConflictDoNothing().run();
        }

        if (seasonsData && seasonsData.length > 0) {
            const epsPerSeasonToAdd = seasonsData.map((data) => ({ mediaId, ...data }));
            tx.insert(epsPerSeasonTable).values(epsPerSeasonToAdd).onConflictDoNothing().run();
        }

        if (networkData && networkData.length > 0) {
            const networkToAdd = networkData.map((n) => ({ mediaId, ...n }));
            tx.insert(networkTable).values(networkToAdd).onConflictDoNothing().run();
        }

        return mediaId;
    }

    updateMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData }: UpdateTvWithDetails) {
        const { mediaTable, actorTable, genreTable, epsPerSeasonTable, networkTable } = this.repoDefinition.tables;

        const previousMedia = getDbClient().select().from(mediaTable).where(eq(mediaTable.apiId, mediaData.apiId)).get()!;

        const [media] = getDbClient()
            .update(mediaTable)
            .set({
                ...mediaData,
                lastApiUpdate: sql`datetime('now')`,
            })
            .where(eq(mediaTable.apiId, mediaData.apiId))
            .returning().all();

        const mediaId = media.id;

        if (actorsData !== undefined) {
            getDbClient().delete(actorTable).where(eq(actorTable.mediaId, mediaId)).run();
            if (actorsData.length > 0) {
                const actorsToAdd = actorsData.map((a) => ({ mediaId, ...a }));
                getDbClient().insert(actorTable).values(actorsToAdd).onConflictDoNothing().run();
            }
        }

        if (Array.isArray(genresData)) {
            getDbClient().delete(genreTable).where(eq(genreTable.mediaId, mediaId)).run();
            if (genresData.length > 0) {
                const genresToAdd = genresData.map((g) => ({ mediaId, ...g }));
                getDbClient().insert(genreTable).values(genresToAdd).onConflictDoNothing().run();
            }
        }

        if (seasonsData && seasonsData.length > 0) {
            this._updateUsersWithMedia(mediaId, seasonsData, previousMedia.duration, media.duration);

            getDbClient().delete(epsPerSeasonTable).where(eq(epsPerSeasonTable.mediaId, mediaId)).run();
            const epsPerSeasonToAdd = seasonsData.map((data) => ({ mediaId, ...data }));
            getDbClient().insert(epsPerSeasonTable).values(epsPerSeasonToAdd).onConflictDoNothing().run();
        }

        if (!seasonsData?.length && previousMedia.duration !== media.duration) {
            this._updateUsersWithMedia(mediaId, this.getMediaEpsPerSeason(mediaId), previousMedia.duration, media.duration);
        }

        if (networkData !== undefined) {
            getDbClient().delete(networkTable).where(eq(networkTable.mediaId, mediaId)).run();
            if (networkData.length > 0) {
                const networkToAdd = networkData.map((n) => ({ mediaId, ...n }));
                getDbClient().insert(networkTable).values(networkToAdd).onConflictDoNothing().run();
            }
        }

        return true;
    }

    // --- Logic When Updating Seasons data -----------------------------------

    private _updateUsersWithMedia(mediaId: number, seasonsData: EpsPerSeasonType[], oldDuration: number, duration: number) {
        const { listTable } = this.repoDefinition.tables;
        const oldSeasonsData = this.getMediaEpsPerSeason(mediaId);

        seasonsData = [...seasonsData].sort((a, b) => a.season - b.season);

        // If nothing changed, do nothing
        if (JSON.stringify(oldSeasonsData) === JSON.stringify(seasonsData) && oldDuration === duration) {
            return;
        }

        const oldTotalEpisodes = oldSeasonsData.reduce((total, season) => total + season.episodes, 0);
        const oldMaxSeason = Math.max(...oldSeasonsData.map((season) => season.season), 0);
        const newMaxSeason = Math.max(...seasonsData.map((season) => season.season), 0);
        const hasNewSeason = newMaxSeason > oldMaxSeason;
        const usersWithMediaInTheirList = this._getAllUsersWithMediaInTheirList(mediaId);

        for (const userMedia of usersWithMediaInTheirList) {
            const states = this.getUserSeasons(userMedia.userId, mediaId);
            const oldRedoTotal = getTvSeasonTotals(states).redoEpisodes;

            // Calculate Absolute Progress
            const absoluteProgress = Math.max(0, userMedia.total - oldRedoTotal);
            const shouldMoveToOnHold = hasNewSeason
                && userMedia.autoMoveCompletedTvToOnHold
                && userMedia.status === Status.COMPLETED
                && absoluteProgress >= oldTotalEpisodes;

            this.insertSeasonStates(userMedia.id, seasonsData.map(s => ({ season: s.season, redo: 0, rating: null })));
            const newStates = attachTvSeasonEpisodes(this.getUserSeasons(userMedia.userId, mediaId), seasonsData);
            const totals = getTvSeasonTotals(newStates);
            const newTotal = absoluteProgress + totals.redoEpisodes;
            const newPosition = this._reorderSeasEps(absoluteProgress, seasonsData);

            const status = shouldMoveToOnHold ? Status.ON_HOLD : userMedia.status;
            getDbClient()
                .update(listTable)
                .set({
                    total: newTotal,
                    redo: totals.redo,
                    rating: totals.rating,
                    currentSeason: newPosition.season,
                    currentEpisode: newPosition.episode,
                    status,
                })
                .where(and(eq(listTable.userId, userMedia.userId), eq(listTable.mediaId, mediaId))).run();

            StatsRepository.updateUserPreComputedStatsWithDelta(userMedia.userId, this.identity.mediaType, mediaId, {
                entriesRated: Number(totals.rating !== null) - Number(userMedia.rating !== null),
                sumEntriesRated: (totals.rating ?? 0) - (userMedia.rating ?? 0),
                totalRedo: totals.redo - userMedia.redo,
                totalSpecific: newTotal - userMedia.total,
                timeSpent: newTotal * duration - userMedia.total * oldDuration,
                ...(status !== userMedia.status ? { statusCounts: { [userMedia.status]: -1, [status]: 1 } } : {}),
            });
        }
    }

    private _getAllUsersWithMediaInTheirList(mediaId: number) {
        const { listTable } = this.repoDefinition.tables;

        return getDbClient()
            .select({
                ...getTableColumns(listTable),
                autoMoveCompletedTvToOnHold: user.autoMoveCompletedTvToOnHold,
            })
            .from(listTable)
            .innerJoin(user, eq(listTable.userId, user.id))
            .where(eq(listTable.mediaId, mediaId)).all();
    }

    private _reorderSeasEps(absoluteProgress: number, seasons: EpsPerSeasonType[]) {
        const totalEpsAvailable = seasons.reduce((a, b) => a + b.episodes, 0);

        // If series empty / progress exceeds series length, cap at last possible episode
        if (totalEpsAvailable === 0 || seasons.length === 0) {
            return { season: 1, episode: 0 };
        }

        if (absoluteProgress >= totalEpsAvailable) {
            return {
                season: seasons.at(-1)!.season,
                episode: seasons.at(-1)!.episodes,
            };
        }

        let accumulated = 0;
        for (let i = 0; i < seasons.length; i += 1) {
            const seasonEps = seasons[i].episodes;
            if (accumulated + seasonEps >= absoluteProgress) {
                return {
                    season: seasons[i].season,
                    episode: Math.max(0, absoluteProgress - accumulated),
                };
            }
            accumulated += seasonEps;
        }

        return { season: 1, episode: 0 };
    }
}
