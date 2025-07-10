import {notFound} from "@tanstack/react-router";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {ITvService} from "@/lib/server/types/services.types";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import type {DeltaStats} from "@/lib/server/types/stats.types";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {IProviderService} from "@/lib/server/types/provider.types";
import {ITvRepository} from "@/lib/server/types/repositories.types";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {TvAdvancedStats, UserMediaWithLabels} from "@/lib/server/types/base.types";
import {Achievement, AchievementData} from "@/lib/server/types/achievements.types";
import {TvAchCodeName, TvList, TvType} from "@/lib/server/domain/media/tv/tv.types";
import {animeAchievements} from "@/lib/server/domain/media/tv/anime/achievements.seed";
import {seriesAchievements} from "@/lib/server/domain/media/tv/series/achievements.seed";


export class TvService extends BaseService<
    TvType, TvList, TvAdvancedStats, TvAchCodeName, ITvRepository
> implements ITvService {
    readonly achievementHandlers: Record<TvAchCodeName, (achievement: Achievement, userId?: number) => any>;

    constructor(repository: TvRepository) {
        super(repository);

        this.achievementHandlers = {
            // Anime Achievements
            completed_anime: this.repository.countCompletedAchievementCte.bind(this.repository),
            rated_anime: this.repository.countRatedAchievementCte.bind(this.repository),
            comment_anime: this.repository.countCommentedAchievementCte.bind(this.repository),
            short_anime: this.repository.getDurationAchievementCte.bind(this.repository),
            long_anime: this.repository.getDurationAchievementCte.bind(this.repository),
            shonen_anime: this.repository.specificGenreAchievementCte.bind(this.repository),
            seinen_anime: this.repository.specificGenreAchievementCte.bind(this.repository),
            network_anime: this.repository.getNetworkAchievementCte.bind(this.repository),
            actor_anime: this.repository.getActorAchievementCte.bind(this.repository),

            // Series Achievements
            completed_series: this.repository.countCompletedAchievementCte.bind(this.repository),
            rated_series: this.repository.countRatedAchievementCte.bind(this.repository),
            short_series: this.repository.getDurationAchievementCte.bind(this.repository),
            long_series: this.repository.getDurationAchievementCte.bind(this.repository),
            comedy_series: this.repository.specificGenreAchievementCte.bind(this.repository),
            drama_series: this.repository.specificGenreAchievementCte.bind(this.repository),
            network_series: this.repository.getNetworkAchievementCte.bind(this.repository),
        };
    }

    async calculateAdvancedMediaStats(userId?: number) {
        // If userId not provided, calculations are platform-wide

        // Specific media stats but calculation common
        const ratings = await this.repository.computeRatingStats(userId);
        const genresStats = await this.repository.computeTopGenresStats(userId);
        const totalLabels = await this.repository.computeTotalMediaLabel(userId);
        const releaseDates = await this.repository.computeReleaseDateStats(userId);

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

    async getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: IProviderService) {
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
        const fields: { [key: string]: any } = {};
        fields.apiId = media.apiId;

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
            //@ts-expect-error
            if (Object.prototype.hasOwnProperty.call(payload, key) && editableFields.includes(key)) {
                fields[key] = payload[key];
            }
        }

        await this.repository.updateMediaWithDetails({ mediaData: fields });
    }

    async getComingNext(userId: number) {
        return this.repository.getComingNext(userId);
    }

    async addMediaToUserList(userId: number, mediaId: number, status?: Status) {
        const newStatus = status ?? this.repository.config.mediaList.defaultStatus;

        const media = await this.repository.findByIdAndAddEpsPerSeason(mediaId);
        if (!media) throw notFound();

        const userMedia = await this.repository.findUserMedia(userId, mediaId);
        if (userMedia) throw new FormattedError("Media already in your list");

        const newState = await this.repository.addMediaToUserList(userId, media, newStatus);
        const delta = this.calculateDeltaStats(null, newState, media);

        return { newState, media, delta };
    }

    async updateUserMediaDetails(userId: number, mediaId: number, partialUpdateData: Record<string, any>) {
        const media = await this.repository.findByIdAndAddEpsPerSeason(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) throw new FormattedError("Media not in your list");

        // Add eps per season to oldState
        const mediaEpsPerSeason = await this.repository.getMediaEpsPerSeason(mediaId);
        (media as any).epsPerSeason = mediaEpsPerSeason;
        (oldState as any).epsPerSeason = mediaEpsPerSeason;

        const completeUpdateData = this.completePartialUpdateData(partialUpdateData, oldState);
        const newState = await this.repository.updateUserMediaDetails(userId, mediaId, completeUpdateData);
        const delta = this.calculateDeltaStats(oldState, newState, media);

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

    completePartialUpdateData(partialUpdateData: Record<string, any>, userMedia: TvList) {
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
                    redo2: Array(userMedia.epsPerSeason!.length).fill(0)
                };
            }

            if (completeUpdateData.status === Status.COMPLETED) {
                completeUpdateData = {
                    ...completeUpdateData,
                    currentSeason: userMedia.epsPerSeason![-1].season,
                    lastEpisodeWatched: userMedia.epsPerSeason![-1].episodes,
                };
            }
        }

        return completeUpdateData;
    }

    calculateDeltaStats(oldState: UserMediaWithLabels<TvList> | null, newState: TvList | null, media: TvType) {
        const delta: DeltaStats = {};
        const statusCounts: Partial<Record<Status, number>> = {};

        // Extract Old State Info
        const oldStatus = oldState?.status;
        const oldRating = oldState?.rating;
        const oldComment = oldState?.comment;
        const oldRedo = oldState?.redo2 ?? [];
        const oldFavorite = oldState?.favorite ?? false;
        const oldTotalSpecificValue = oldState?.total ?? 0;
        const oldTotalTimeSpent = oldTotalSpecificValue * media.duration;
        const oldSumRedo = oldState?.redo2.reduce((a, c) => a + c, 0) ?? 0;
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
        const valuesToApply = redoDiff?.reduce((sum, diff, i) => sum + diff * media.epsPerSeason![i].episodes, 0);

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
