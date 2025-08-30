import {eq, isNotNull} from "drizzle-orm";
import {notFound} from "@tanstack/react-router";
import {DeltaStats} from "@/lib/types/stats.types";
import {Achievement} from "@/lib/types/achievements.types";
import {Status, UpdateType} from "@/lib/server/utils/enums";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {AnimeSchemaConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {TvAchCodeName, TvList, TvType} from "@/lib/server/domain/media/tv/tv.types";
import {SeriesSchemaConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {EpsSeasonPayload, LogPayload, RedoTvPayload, StatsCTE, StatusPayload, UserMediaWithLabels} from "@/lib/types/base.types";


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

        this.updateHandlers = {
            ...this.updateHandlers,
            [UpdateType.REDO]: this.updateRedoHandler.bind(this),
            [UpdateType.STATUS]: this.updateStatusHandler.bind(this),
            [UpdateType.TV]: this.updateEpsSeasonsHandler.bind(this),
        }
    }

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

    async getMediaEditableFields(mediaId: number) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const editableFields = this.repository.config.editableFields;
        const fields: Record<string, any> = {};

        editableFields.forEach((field) => {
            if (field in media) {
                fields[field] = media[field as keyof typeof media];
            }
        });

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

    calculateDeltaStats(oldState: UserMediaWithLabels<TvList> | null, newState: TvList | null, media: TvType) {
        const delta: DeltaStats = {};
        const statusCounts: Partial<Record<Status, number>> = {};

        // Extract Old State Info
        const oldStatus = oldState?.status;
        const oldRating = oldState?.rating;
        const oldComment = oldState?.comment;
        const oldFavorite = oldState?.favorite ?? false;
        const oldTotalSpecificValue = oldState?.total ?? 0;
        const oldTotalTimeSpent = oldTotalSpecificValue * media.duration;
        const oldRedo = oldState?.redo2;
        const oldSumRedo = oldRedo ? oldRedo.reduce((a, c) => a + c, 0) : 0;
        const wasCompleted = oldStatus === Status.COMPLETED;
        const wasFavorited = wasCompleted && oldFavorite;
        const wasCommented = wasCompleted && !!oldComment;
        const wasRated = wasCompleted && oldRating != null;

        // Extract New State Info
        const newStatus = newState?.status;
        const newRating = newState?.rating;
        const newComment = newState?.comment;
        const newFavorite = newState?.favorite ?? false;
        const newTotalSpecificValue = newState?.total ?? 0;
        const newTotalTimeSpent = newTotalSpecificValue * media.duration;
        const newSumRedo = newState?.redo2.reduce((a, c) => a + c, 0) ?? 0;
        const isCompleted = newStatus === Status.COMPLETED;
        const isFavorited = isCompleted && newFavorite;
        const isCommented = isCompleted && !!newComment;
        const isRated = isCompleted && newRating != null;


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

    async updateRedoHandler(currentState: TvList, payload: RedoTvPayload, media: TvType): Promise<[TvList, LogPayload]> {
        const newState = { ...currentState, redo2: payload.redo };
        const epsPerSeason = await this.repository.getMediaEpsPerSeason(media.id);

        const logPayload = {
            oldValue: currentState.redo2.reduce((a, b) => a + b, 0),
            newValue: payload.redo.reduce((a, b) => a + b, 0),
        };

        const redoDiff: number[] = newState.redo2.map((val: number, idx: number) => val - currentState.redo2[idx]);
        const valuesToApply = redoDiff.reduce((sum, diff, i) => sum + diff * epsPerSeason[i].episodes, 0);
        newState.total = (currentState?.total ?? 0) + (valuesToApply ?? 0);

        return [newState, logPayload];
    }

    async updateStatusHandler(currentState: TvList, payload: StatusPayload, media: TvType): Promise<[TvList, LogPayload]> {
        const newState = { ...currentState, status: payload.status };
        const specialStatuses: Status[] = [Status.RANDOM, Status.PLAN_TO_WATCH];
        const epsPerSeason = await this.repository.getMediaEpsPerSeason(media.id);
        const logPayload = { oldValue: currentState.status, newValue: payload.status };

        if (specialStatuses.includes(currentState.status) && !specialStatuses.includes(newState.status)) {
            newState.lastEpisodeWatched = 1;
        }

        if (payload.status === Status.COMPLETED) {
            const addedEpisodes = epsPerSeason.reduce((a, b) => a + b.episodes, 0);
            const oldTotal = currentState.redo2.reduce((a, b, i) => a + b * epsPerSeason[i].episodes, 0);

            newState.currentSeason = epsPerSeason.at(-1)!.season;
            newState.lastEpisodeWatched = epsPerSeason.at(-1)!.episodes;
            newState.total = addedEpisodes + oldTotal;
        }
        else if (specialStatuses.includes(payload.status)) {
            newState.total = 0;
            newState.currentSeason = 1;
            newState.lastEpisodeWatched = 0;
            newState.redo2 = Array(epsPerSeason.length).fill(0);
        }

        return [newState, logPayload];
    }

    async updateEpsSeasonsHandler(currentState: TvList, payload: EpsSeasonPayload, media: TvType): Promise<[TvList, LogPayload]> {
        const epsPerSeason = await this.repository.getMediaEpsPerSeason(media.id);
        const epsPerSeasonList = epsPerSeason.map((eps) => eps.episodes);

        if (payload.currentSeason) {
            if (payload.currentSeason > epsPerSeason.length) {
                throw new FormattedError("Invalid season number");
            }

            const newState = { ...currentState, currentSeason: payload.currentSeason };
            const logPayload = {
                oldValue: [currentState.currentSeason, currentState.lastEpisodeWatched],
                newValue: [payload.currentSeason, 1],
            }

            const newWatched = epsPerSeasonList.slice(0, payload.currentSeason - 1).reduce((a, b) => a + b, 0) + 1;
            const newTotal = newWatched + currentState.redo2.reduce((a, b, i) => a + b * epsPerSeasonList[i], 0);

            newState.total = newTotal
            newState.lastEpisodeWatched = 1;

            return [newState, logPayload] as [TvList, LogPayload];
        }

        if (payload.lastEpisodeWatched) {
            if (payload.lastEpisodeWatched > epsPerSeason[currentState.currentSeason - 1].episodes) {
                throw new FormattedError("Invalid episode");
            }

            const newState = { ...currentState, lastEpisodeWatched: payload.lastEpisodeWatched };
            const logPayload = {
                oldValue: [currentState.currentSeason, currentState.lastEpisodeWatched],
                newValue: [currentState.currentSeason, payload.lastEpisodeWatched],
            }

            const newWatched = epsPerSeasonList
                .slice(0, currentState.currentSeason - 1)
                .reduce((a, b) => a + b, 0) + payload.lastEpisodeWatched;

            newState.total = newWatched + currentState.redo2.reduce((a, b, i) => a + b * epsPerSeasonList[i], 0);

            return [newState, logPayload] as [TvList, LogPayload];
        }

        return [currentState, null];
    }
}
