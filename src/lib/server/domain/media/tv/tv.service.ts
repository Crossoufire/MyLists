import {eq, isNotNull} from "drizzle-orm";
import {notFound} from "@tanstack/react-router";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import type {DeltaStats} from "@/lib/server/types/stats.types";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {StatsCTE, UserMediaWithLabels} from "@/lib/server/types/base.types";
import {AnimeSchemaConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {Achievement, AchievementData} from "@/lib/server/types/achievements.types";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {SeriesSchemaConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {animeAchievements} from "@/lib/server/domain/media/tv/anime/achievements.seed";
import {seriesAchievements} from "@/lib/server/domain/media/tv/series/achievements.seed";
import {TvAchCodeName, TvList, TvListWithEps, TvTypeWithEps} from "@/lib/server/domain/media/tv/tv.types";


export class TvService extends BaseService<AnimeSchemaConfig | SeriesSchemaConfig, TvRepository> {
    readonly achievementHandlers: Record<TvAchCodeName, (achievement: Achievement, userId?: number) => StatsCTE>;

    constructor(repository: TvRepository) {
        super(repository);

        const { listTable } = this.repository.config;

        this.achievementHandlers = {
            completed_anime: this.repository.countAchievementCte.bind(this.repository, eq(listTable.status, Status.COMPLETED)),
            rated_anime: this.repository.countAchievementCte.bind(this.repository, isNotNull(listTable.rating)),
            comment_anime: this.repository.countAchievementCte.bind(this.repository, isNotNull(listTable.comment)),
            short_anime: this.repository.getDurationAchievementCte.bind(this.repository),
            long_anime: this.repository.getDurationAchievementCte.bind(this.repository),
            shonen_anime: this.repository.specificGenreAchievementCte.bind(this.repository),
            seinen_anime: this.repository.specificGenreAchievementCte.bind(this.repository),
            network_anime: this.repository.getNetworkAchievementCte.bind(this.repository),
            actor_anime: this.repository.getActorAchievementCte.bind(this.repository),

            completed_series: this.repository.countAchievementCte.bind(this.repository, eq(listTable.status, Status.COMPLETED)),
            rated_series: this.repository.countAchievementCte.bind(this.repository, isNotNull(listTable.rating)),
            short_series: this.repository.getDurationAchievementCte.bind(this.repository),
            long_series: this.repository.getDurationAchievementCte.bind(this.repository),
            comedy_series: this.repository.specificGenreAchievementCte.bind(this.repository),
            drama_series: this.repository.specificGenreAchievementCte.bind(this.repository),
            network_series: this.repository.getNetworkAchievementCte.bind(this.repository),
        };
    }

    async getComingNext(userId: number) {
        return this.repository.getComingNext(userId);
    }

    // --- Implemented Methods ----------------------------------------------

    async calculateAdvancedMediaStats(userId?: number) {
        // If userId not provided, calculations are platform-wide
        const { ratings, genresStats, totalLabels, releaseDates } = await super.calculateAdvancedMediaStats(userId);

        // Specific stats
        const avgDuration = await this.repository.avgTvDuration(userId);
        const totalSeasons = await this.repository.computeTotalSeasons(userId);
        const durationDistrib = await this.repository.tvDurationDistrib(userId);
        const { networksStats, actorsStats, countriesStats } = await this.repository.specificTopMetrics(userId);

        return {
            ratings,
            totalLabels,
            genresStats,
            releaseDates,
            totalSeasons,
            avgDuration,
            durationDistrib,
            networksStats,
            actorsStats,
            countriesStats,
        };
    }

    async getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: BaseProviderService<any>) {
        const media = external ?
            await this.repository.findByApiId(mediaId) : await this.repository.findById(mediaId as number);

        let internalMediaId = media?.id;
        if (external && !internalMediaId) {
            internalMediaId = await providerService.fetchAndStoreMediaDetails(mediaId as unknown as number);
            if (!internalMediaId) throw new FormattedError("Failed to fetch media details");
        }

        if (internalMediaId) {
            const mediaWithDetails = await this.repository.findAllAssociatedDetails(internalMediaId);
            if (!mediaWithDetails) throw notFound();

            const userMedia = await this.repository.findUserMedia(userId, mediaWithDetails.id);
            if (userMedia) (userMedia as any).epsPerSeason = mediaWithDetails.epsPerSeason;

            const similarMedia = await this.repository.findSimilarMedia(mediaWithDetails.id)
            const followsData = await this.repository.getUserFollowsMediaData(userId, mediaWithDetails.id);

            return {
                media: mediaWithDetails,
                userMedia,
                followsData,
                similarMedia,
            };
        }

        throw notFound();
    }

    async getMediaEditableFields(mediaId: number) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const editableFields = this.repository.config.editableFields;
        const fields = editableFields.reduce((acc, field) => {
            if (field in media) {
                (acc as any)[field] = media[field];
            }
            return acc;
        }, {} as Pick<typeof media, typeof editableFields[number]>);

        return { fields };
    }

    async updateMediaEditableFields(mediaId: number, payload: Record<string, any>) {
        const media = await this.repository.findById(mediaId);
        if (!media) {
            throw notFound();
        }

        const editableFields = this.repository.config.editableFields;
        type FieldsType = typeof editableFields[number];
        const fields: Partial<Record<FieldsType, any>> & { apiId: typeof media.apiId; } = { apiId: media.apiId };

        if (payload?.imageCover) {
            const imageName = await saveImageFromUrl({
                defaultName: "default.jpg",
                imageUrl: payload.imageCover,
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/movies-covers",
            });
            fields.imageCover = imageName;
            delete payload.imageCover;
        }

        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key) && editableFields.includes(key as FieldsType)) {
                fields[key as FieldsType] = payload[key];
            }
        }

        await this.repository.updateMediaWithDetails({ mediaData: fields as any });
    }

    async addMediaToUserList(userId: number, mediaId: number, status?: Status) {
        const newStatus = status ?? this.repository.config.mediaList.defaultStatus;

        const media = await this.repository.findByIdAndAddEpsPerSeason(mediaId);
        if (!media) throw notFound();

        const userMedia = await this.repository.findUserMedia(userId, mediaId);
        if (userMedia) throw new FormattedError("Media already in your list");

        const newState = await this.repository.addMediaToUserList(userId, media, newStatus);
        (newState as any).epsPerSeason = media.epsPerSeason;

        const delta = this.calculateDeltaStats(null, newState, media as TvTypeWithEps);

        return { newState, media, delta };
    }

    async updateUserMediaDetails(userId: number, mediaId: number, partialUpdateData: Record<string, any>) {
        const media = await this.repository.findByIdAndAddEpsPerSeason(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) throw new FormattedError("Media not in your list");

        const mediaEpsPerSeason = await this.repository.getMediaEpsPerSeason(mediaId);
        (media as any).epsPerSeason = mediaEpsPerSeason;
        (oldState as any).epsPerSeason = mediaEpsPerSeason;

        const completeUpdateData = this.completePartialUpdateData(partialUpdateData, oldState as any);
        const newState = await this.repository.updateUserMediaDetails(userId, mediaId, completeUpdateData);
        const delta = this.calculateDeltaStats(oldState, newState, media as TvTypeWithEps);

        return { os: oldState, ns: newState, media, delta, updateData: completeUpdateData };
    }

    async removeMediaFromUserList(userId: number, mediaId: number) {
        const media = await this.repository.findByIdAndAddEpsPerSeason(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) throw new FormattedError("Media not in your list");

        await this.repository.removeMediaFromUserList(userId, mediaId);
        const delta = this.calculateDeltaStats(oldState, null, media);

        return delta;
    }

    completePartialUpdateData(partialUpdateData: Record<string, any>, userMedia: TvListWithEps) {
        let completeUpdateData = { ...partialUpdateData };

        if (completeUpdateData.status) {
            if (userMedia.lastEpisodeWatched === 0 && ![Status.PLAN_TO_WATCH, Status.RANDOM].includes(completeUpdateData.status)) {
                completeUpdateData = { ...completeUpdateData, lastEpisodeWatched: 1 };
            }

            if ([Status.PLAN_TO_WATCH, Status.RANDOM].includes(completeUpdateData.status)) {
                completeUpdateData = {
                    ...completeUpdateData,
                    currentSeason: 1,
                    lastEpisodeWatched: 1,
                    redo2: Array(userMedia.epsPerSeason.length).fill(0)
                };
            }

            if (completeUpdateData.status === Status.COMPLETED) {
                completeUpdateData = {
                    ...completeUpdateData,
                    currentSeason: userMedia.epsPerSeason.at(-1)!.season,
                    lastEpisodeWatched: userMedia.epsPerSeason.at(-1)!.episodes,
                };
            }
        }

        if (completeUpdateData.currentSeason) {
            completeUpdateData = { ...completeUpdateData, lastEpisodeWatched: 1 };
        }

        return completeUpdateData;
    }

    calculateDeltaStats(oldState: UserMediaWithLabels<TvList> | null, newState: TvList | null, media: TvTypeWithEps) {
        const delta: DeltaStats = {};
        const statusCounts: Partial<Record<Status, number>> = {};

        // Extract Old State Info
        const oldStatus = oldState?.status;
        const oldRating = oldState?.rating;
        const oldComment = oldState?.comment;
        const oldFavorite = oldState?.favorite ?? false;
        const oldTotalSpecificValue = oldState?.total ?? 0;
        const oldTotalTimeSpent = oldTotalSpecificValue * media.duration;
        const oldRedo = oldState?.redo2 ?? Array(media.epsPerSeason.length).fill(0);
        const oldSumRedo = oldRedo.reduce((a, c) => a + c, 0) ?? 0;
        const wasCompleted = oldStatus === Status.COMPLETED;
        const wasFavorited = wasCompleted && oldFavorite;
        const wasCommented = wasCompleted && !!oldComment;
        const wasRated = wasCompleted && oldRating != null;

        // Extract New State Info
        const newRedo = newState?.redo2;
        const newStatus = newState?.status;
        const newRating = newState?.rating;
        const newComment = newState?.comment;
        const newFavorite = newState?.favorite ?? false;
        const newSumRedo = newState?.redo2.reduce((a, c) => a + c, 0) ?? 0;
        const isCompleted = newStatus === Status.COMPLETED;
        const isFavorited = isCompleted && newFavorite;
        const isCommented = isCompleted && !!newComment;
        const isRated = isCompleted && newRating != null;

        const redoDiff = newRedo?.map((val, idx) => val - oldRedo[idx]);
        const valuesToApply = redoDiff?.reduce((sum, diff, i) => sum + diff * media.epsPerSeason[i].episodes, 0);
        const newTotalSpecificValue = oldTotalSpecificValue + (valuesToApply ?? 0);
        const newTotalTimeSpent = newTotalSpecificValue * media.duration;

        // --- Calculate Deltas ----------------------------------------------------------------

        // Total Entries
        if (!oldState && newState) {
            delta.totalEntries = 1;
        }
        else if (oldState && !newState) {
            delta.totalEntries = -1;
        }

        // Status Counts
        if (oldStatus !== newStatus) {
            if (oldStatus) {
                statusCounts[oldStatus] = (statusCounts[oldStatus] ?? 0) - 1;
            }
            if (newStatus) {
                statusCounts[newStatus] = (statusCounts[newStatus] ?? 0) + 1;
            }
        }

        // Time Spent
        delta.timeSpent = (newTotalTimeSpent - oldTotalTimeSpent);

        // Total Redo Count
        delta.totalRedo = (newSumRedo - oldSumRedo);

        // Total Specific
        delta.totalSpecific = (newTotalSpecificValue - oldTotalSpecificValue);

        // Rating Stats
        let entriesRatedDelta = 0;
        let sumEntriesRatedDelta = 0;
        if (wasRated && !isRated) {
            entriesRatedDelta = -1;
            sumEntriesRatedDelta = -(oldRating ?? 0);
        }
        else if (!wasRated && isRated) {
            entriesRatedDelta = 1;
            sumEntriesRatedDelta = newRating ?? 0;
        }
        else if (wasRated && isRated && oldRating !== newRating) {
            sumEntriesRatedDelta = (newRating ?? 0) - (oldRating ?? 0);
        }
        delta.entriesRated = entriesRatedDelta;
        delta.sumEntriesRated = sumEntriesRatedDelta;

        // Comment Stats
        let entriesCommentedDelta = 0;
        if (wasCommented && !isCommented) {
            entriesCommentedDelta = -1;
        }
        else if (!wasCommented && isCommented) {
            entriesCommentedDelta = 1;
        }
        delta.entriesCommented = entriesCommentedDelta;

        // Favorite Stats
        let entriesFavoritesDelta = 0;
        if (wasFavorited && !isFavorited) {
            entriesFavoritesDelta = -1;
        }
        else if (!wasFavorited && isFavorited) {
            entriesFavoritesDelta = 1;
        }
        delta.entriesFavorites = entriesFavoritesDelta;

        // Add statusCounts to delta only if entries
        if (Object.keys(statusCounts).length > 0) {
            delta.statusCounts = statusCounts;
        }

        return delta;
    }

    getAchievementsDefinition(mediaType?: MediaType) {
        if (mediaType === MediaType.ANIME) {
            return animeAchievements as unknown as AchievementData[];
        }
        else if (mediaType === MediaType.SERIES) {
            return seriesAchievements as unknown as AchievementData[];
        }
        else {
            return [] as AchievementData[];
        }
    }
}
