import {notFound} from "@tanstack/react-router";
import type {StatsDelta} from "@/lib/server/types/stats.types";
import {JobType, MediaType, Status} from "@/lib/server/utils/enums";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";


interface UserMediaState {
    redo: number;
    total: number;
    mediaId: number;
    favorite: boolean;
    status: Status | null;
    rating: number | null | undefined;
    comment: string | null | undefined;
}


export class MoviesService {
    constructor(private repository: MoviesRepository) {
    }

    async getById(mediaId: number) {
        return this.repository.findById(mediaId);
    }

    async searchByName(query: string) {
        return this.repository.searchByName(query);
    }

    async getMediaDetails(mediaId: number | string, external: boolean, strategy: any) {
        const media = external ? await this.repository.findByApiId(mediaId) : await this.repository.findById(mediaId);

        let mediaWithDetails;
        let internalMediaId = media?.id;

        if (external && !internalMediaId) {
            internalMediaId = await strategy.processAndStoreMedia(mediaId);
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

        return mediaWithDetails;
    }

    async getUserMediaLabels(userId: number) {
        return await this.repository.getUserMediaLabels(userId);
    }

    async editUserLabel({ userId, label, mediaId, action }: EditUserLabels) {
        return this.repository.editUserLabel({ userId, label, mediaId, action });
    }

    async getUserMediaDetails(userId: number, mediaId: number) {
        return await this.repository.findUserMedia(userId, mediaId);
    }

    async getUserFollowsMediaData(userId: number, mediaId: number) {
        return await this.repository.getUserFollowsMediaData(userId, mediaId);
    }

    async findSimilarMedia(mediaId: number) {
        return await this.repository.findSimilarMedia(mediaId);
    }

    async getMediaList(currentUserId: number | undefined, userId: number, args: any) {
        return this.repository.getMediaList(currentUserId, userId, args);
    }

    async getListFilters(userId: number) {
        return this.repository.getListFilters(userId);
    }

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        return this.repository.getSearchListFilters(userId, query, job);
    }

    async getComingNext(userId: number) {
        const comingNextData = await this.repository.getComingNext(userId);
        return { items: comingNextData, mediaType: MediaType.MOVIES };
    }

    async addMediaToUserList(userId: number, mediaId: number, status?: Status) {
        const newStatus = status ?? this.repository.config.defaultStatus;

        const media = await this.repository.findById(mediaId);
        if (!media) {
            throw notFound();
        }

        const userMedia = await this.repository.findUserMedia(userId, mediaId);
        if (userMedia) {
            throw new Error("Media already in your list");
        }

        const newState = await this.repository.addMediaToUserList(userId, mediaId, newStatus);

        const delta = this.calculateDeltaStats(null, newState as UserMediaState, media);

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
        const delta = this.calculateDeltaStats(oldState as unknown as UserMediaState, newState as UserMediaState, media);

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
        const delta = this.calculateDeltaStats(oldState as unknown as UserMediaState, null, media);

        return delta;
    }

    completePartialUpdateData(partialUpdateData: Record<string, any>) {
        const completeUpdateData = { ...partialUpdateData };

        if (completeUpdateData.status) {
            return { ...completeUpdateData, redo: 0 };
        }
        return completeUpdateData;
    }

    calculateDeltaStats(oldState: UserMediaState | null, newState: UserMediaState | null, media: any) {
        const delta: StatsDelta = {};
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
}
