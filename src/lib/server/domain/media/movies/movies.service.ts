import {notFound} from "@tanstack/react-router";
import {JobType, Status} from "@/lib/server/utils/enums";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import type {DeltaStats} from "@/lib/server/types/stats.types";
import {Achievement, AchievementData} from "@/lib/server/types/achievements";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";
import {movies, moviesActors, moviesGenre} from "@/lib/server/database/schema";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {MoviesAchCodeName, moviesAchievements} from "@/lib/server/domain/media/movies/achievements.seed";


interface UserMovieState {
    redo: number;
    total: number;
    mediaId: number;
    favorite: boolean;
    status: Status | null;
    rating: number | null | undefined;
    comment: string | null | undefined;
}


export class MoviesService {
    private readonly achievementHandlers: Record<MoviesAchCodeName, (achievement: Achievement, userId?: number) => any>;

    constructor(private repository: MoviesRepository) {
        this.achievementHandlers = {
            completed_movies: this.repository.countCompletedAchievementCte.bind(this.repository),
            rated_movies: this.repository.countRatedAchievementCte.bind(this.repository),
            comment_movies: this.repository.countCommentedAchievementCte.bind(this.repository),
            director_movies: this.repository.getDirectorAchievementCte.bind(this.repository),
            actor_movies: this.repository.getActorAchievementCte.bind(this.repository),
            origin_lang_movies: this.repository.getOriginLanguageAchievementCte.bind(this.repository),
            war_genre_movies: this.repository.specificGenreAchievementCte.bind(this.repository),
            family_genre_movies: this.repository.specificGenreAchievementCte.bind(this.repository),
            sci_genre_movies: this.repository.specificGenreAchievementCte.bind(this.repository),
            animation_movies: this.repository.specificGenreAchievementCte.bind(this.repository),
            long_movies: this.repository.getDurationAchievementCte.bind(this.repository),
            short_movies: this.repository.getDurationAchievementCte.bind(this.repository),
        };
    }

    async getById(mediaId: number) {
        return this.repository.findById(mediaId);
    }

    async downloadMediaListAsCSV(userId: number) {
        return this.repository.downloadMediaListAsCSV(userId);
    }

    async getNonListMediaIds() {
        return this.repository.getNonListMediaIds();
    }

    async removeMediaByIds(mediaIds: number[]) {
        const tables = [moviesActors, moviesGenre, movies];
        return this.repository.removeMediaByIds(mediaIds, tables);
    }

    async getCoverFilenames() {
        const coverFilenames = await this.repository.getCoverFilenames();
        return coverFilenames.map(({ imageCover }) => imageCover.split("/").pop() as string);
    }

    async lockOldMovies() {
        return this.repository.lockOldMovies();
    }

    async searchByName(query: string) {
        return this.repository.searchByName(query);
    }

    async getMediaToNotify() {
        return this.repository.getMediaToNotify();
    }

    async computeAllUsersStats() {
        return this.repository.computeAllUsersStats();
    }

    async getAchievementCte(achievement: Achievement, userId?: number) {
        const handler = this.achievementHandlers[achievement.codeName as MoviesAchCodeName];
        if (!handler) {
            throw new Error("Invalid Achievement codeName");
        }
        return handler(achievement, userId);
    }

    async calculateAdvancedMediaStats(userId?: number) {
        // If userId not provided, calculations are platform-wide

        // Specific media stats but calculation common
        const ratings = await this.repository.computeRatingStats(userId);
        const genresStats = await this.repository.computeTopGenresStats(userId);
        const totalLabels = await this.repository.computeTotalMediaLabel(userId);
        const releaseDates = await this.repository.computeReleaseDateStats(userId);

        // Specific stats
        const avgDuration = await this.repository.avgMovieDuration(userId);
        const durationDistrib = await this.repository.movieDurationDistrib(userId);
        const { totalBudget, totalRevenue } = await this.repository.budgetRevenueStats(userId);
        const { directorsStats, actorsStats, languagesStats } = await this.repository.specificTopMetrics(userId);

        return {
            ratings,
            totalLabels,
            genresStats,
            releaseDates,
            totalBudget,
            totalRevenue,
            avgDuration,
            durationDistrib,
            directorsStats,
            actorsStats,
            languagesStats,
        };
    }

    async computeTotalMediaLabel(userId?: number) {
        return this.repository.computeTotalMediaLabel(userId);
    }

    async getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: any) {
        const media = external ? await this.repository.findByApiId(mediaId) : await this.repository.findById(mediaId);

        let mediaWithDetails;
        let internalMediaId = media?.id;

        if (external && !internalMediaId) {
            internalMediaId = await providerService.fetchAndStoreMediaDetails(mediaId as unknown as number);
            if (!internalMediaId) {
                throw new Error("Failed to fetch media details");
            }
        }

        if (internalMediaId) {
            mediaWithDetails = await this.repository.findAllAssociatedDetails(internalMediaId);
        }
        else {
            throw new Error("Movie not found");
        }

        const similarMedia = await this.repository.findSimilarMedia(mediaWithDetails.id)
        const userMedia = await this.repository.findUserMedia(userId, mediaWithDetails.id);
        const followsData = await this.repository.getUserFollowsMediaData(userId, mediaWithDetails.id);

        return { media: mediaWithDetails, userMedia, followsData, similarMedia };
    }

    async getMediaEditableFields(mediaId: number) {
        const media = await this.repository.findById(mediaId);
        if (!media) {
            throw notFound();
        }

        const editableFields = this.repository.config.editableFields;
        const fields: { [key: string]: any } = {};

        for (const key in media) {
            if (Object.prototype.hasOwnProperty.call(media, key) && editableFields.includes(key)) {
                fields[key] = media[key];
            }
        }

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

        // TODO: check types and values for fields (to meditate because only manager endpoint -> can be less strict)

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
            if (Object.prototype.hasOwnProperty.call(payload, key) && editableFields.includes(key)) {
                fields[key] = payload[key];
            }
        }

        await this.repository.updateMediaWithDetails({ mediaData: fields });
    }

    async getUserMediaLabels(userId: number) {
        return await this.repository.getUserMediaLabels(userId);
    }

    async editUserLabel({ userId, label, mediaId, action }: EditUserLabels) {
        return this.repository.editUserLabel({ userId, label, mediaId, action });
    }

    async getMediaList(currentUserId: number | undefined, userId: number, args: any) {
        return this.repository.getMediaList(currentUserId, userId, args);
    }

    async getListFilters(userId: number) {
        return this.repository.getListFilters(userId);
    }

    async getMediaJobDetails(userId: number, job: JobType, name: string, search: Record<string, any>) {
        const page = search.page ?? 1;
        const perPage = search.perPage ?? 25;
        const offset = (page - 1) * perPage;

        return this.repository.getMediaJobDetails(userId, job, name, offset, perPage);
    }

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        return this.repository.getSearchListFilters(userId, query, job);
    }

    async getComingNext(userId: number) {
        return this.repository.getComingNext(userId);
    }

    async addMediaToUserList(userId: number, mediaId: number, status?: Status) {
        const newStatus = status ?? this.repository.config.mediaList.defaultStatus;

        const media = await this.repository.findById(mediaId);
        if (!media) {
            throw notFound();
        }

        const userMedia = await this.repository.findUserMedia(userId, mediaId);
        if (userMedia) {
            throw new Error("Media already in your list");
        }

        const newState = await this.repository.addMediaToUserList(userId, mediaId, newStatus);

        const delta = this.calculateDeltaStats(null, newState as UserMovieState, media);

        return { newState, media, delta };
    }

    async updateUserMediaDetails(userId: number, mediaId: number, partialUpdateData: Record<string, any>) {
        const media = await this.repository.findById(mediaId);
        if (!media) {
            throw notFound();
        }

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) {
            throw new Error("Media not in your list");
        }

        const completeUpdateData = this.completePartialUpdateData(partialUpdateData);
        const newState = await this.repository.updateUserMediaDetails(userId, mediaId, completeUpdateData);
        const delta = this.calculateDeltaStats(oldState as unknown as UserMovieState, newState as UserMovieState, media);

        return { os: oldState, ns: newState, media, delta, updateData: completeUpdateData };
    }

    async removeMediaFromUserList(userId: number, mediaId: number) {
        const media = await this.repository.findById(mediaId);
        if (!media) {
            throw notFound();
        }

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) {
            throw new Error("Media not in your list");
        }

        await this.repository.removeMediaFromUserList(userId, mediaId);
        const delta = this.calculateDeltaStats(oldState as unknown as UserMovieState, null, media);

        return delta;
    }

    completePartialUpdateData(partialUpdateData: Record<string, any>) {
        const completeUpdateData = { ...partialUpdateData };

        if (completeUpdateData.status) {
            return { ...completeUpdateData, redo: 0 };
        }
        return completeUpdateData;
    }

    calculateDeltaStats(oldState: UserMovieState | null, newState: UserMovieState | null, media: any) {
        const delta: DeltaStats = {};
        const statusCounts: Partial<Record<Status, number>> = {};

        // Extract Old State Info
        const oldStatus = oldState?.status;
        const oldRating = oldState?.rating;
        const oldRedo = oldState?.redo ?? 0;
        const oldComment = oldState?.comment;
        const oldFavorite = oldState?.favorite ?? false;
        const wasCompleted = oldStatus === Status.COMPLETED;
        const wasFavorited = wasCompleted && oldFavorite;
        const wasCommented = wasCompleted && !!oldComment;
        const wasRated = wasCompleted && oldRating != null;
        const oldTotalSpecificValue = oldState ? (wasCompleted ? 1 : 0) + oldRedo : 0;
        const oldTotalTimeSpent = oldTotalSpecificValue * media.duration;

        // Extract New State Info
        const newStatus = newState?.status;
        const newRating = newState?.rating;
        const newRedo = newState?.redo ?? 0;
        const newComment = newState?.comment;
        const newFavorite = newState?.favorite ?? false;
        const isCompleted = newStatus === Status.COMPLETED;
        const isFavorited = isCompleted && newFavorite;
        const isCommented = isCompleted && !!newComment;
        const isRated = isCompleted && newRating != null;
        const newTotalSpecificValue = newState ? (isCompleted ? 1 : 0) + newRedo : 0;
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
        delta.totalRedo = (newRedo - oldRedo);

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

    getAchievementsDefinition() {
        return moviesAchievements as unknown as AchievementData[];
    }
}
