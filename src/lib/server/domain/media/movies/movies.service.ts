import {JobType, Status} from "@/lib/server/utils/enums";
import type {StatsDelta} from "@/lib/server/types/stats.types";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";


export class MoviesService {
    constructor(private repository: MoviesRepository) {
    }

    async getMediaDetails(mediaId: number, external: boolean, strategy: any) {
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

    async getMinimalMediaDetails(mediaId: number) {
        return await this.repository.findById(mediaId);
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

    async updateUserMediaDetails(userId: number, mediaId: number, updateData: any) {
        return this.repository.updateUserMediaDetails(userId, mediaId, updateData);
    }

    calculateDeltaStats(oldState: any | null, newState: any, mediaDetails: any) {
        const delta: StatsDelta = { statusCounts: {} };

        const oldStatus: Status | null = oldState?.status;
        const newStatus: Status | null = newState.status;
        const oldRating = oldState?.rating;
        const newRating = newState.rating;
        const oldComment = oldState?.comment;
        const newComment = newState.comment;
        const oldFavorite = oldState?.favorite;
        const newFavorite = newState.favorite;
        const oldRedo = oldState?.redo ?? 0;
        const newRedo = newState.redo ?? 0;

        const movieDuration = mediaDetails.duration!;

        if (oldStatus !== newStatus) {
            if (oldStatus) {
                delta.statusCounts![oldStatus] = (delta.statusCounts![oldStatus] ?? 0) - 1;
            }
            if (newStatus) {
                delta.statusCounts![newStatus] = (delta.statusCounts![newStatus] ?? 0) + 1;
            }

            const wasWatched = oldStatus !== null && oldStatus === Status.COMPLETED;
            const isNowWatched = newStatus !== null && newStatus === Status.COMPLETED;

            if (!wasWatched && isNowWatched) {
                delta.timeSpent = (delta.timeSpent ?? 0) + movieDuration;
            }
            else if (wasWatched && !isNowWatched) {
                delta.timeSpent = (delta.timeSpent ?? 0) - movieDuration;
                if (oldRating !== null && oldRating !== undefined) {
                    delta.entriesRated = (delta.entriesRated ?? 0) - 1;
                    delta.sumEntriesRated = (delta.sumEntriesRated ?? 0) - oldRating;
                }
                if (oldComment) {
                    delta.entriesCommented = (delta.entriesCommented ?? 0) - 1;
                }
                if (oldFavorite) {
                    delta.entriesFavorites = (delta.entriesFavorites ?? 0) - 1;
                }
            }
        }

        if (newStatus === Status.COMPLETED) {
            const hadRating = oldRating !== null && oldRating !== undefined;
            const hasRating = newRating !== null && newRating !== undefined;

            if (!hadRating && hasRating) {
                delta.entriesRated = (delta.entriesRated ?? 0) + 1;
                delta.sumEntriesRated = (delta.sumEntriesRated ?? 0) + newRating;
            }
            else if (hadRating && !hasRating) {
                // Removed a rating (should only happen if status also changed away from watched, handled above)
                // This case might be redundant if cleanup logic is robust.
            }
            else if (hadRating && hasRating && oldRating !== newRating) {
                // Changed an existing rating
                delta.sumEntriesRated =
                    (delta.sumEntriesRated ?? 0) + (newRating - oldRating);
            }
        }

        if (newStatus === Status.COMPLETED) {
            const hadComment = !!oldComment;
            const hasComment = !!newComment;
            if (!hadComment && hasComment) {
                delta.entriesCommented = (delta.entriesCommented ?? 0) + 1;
            }
            else if (hadComment && !hasComment) {
                // This case might be redundant if cleanup logic is robust.
                // delta.entriesCommented = (delta.entriesCommented ?? 0) - 1;
            }
        }

        if (newStatus === Status.COMPLETED) {
            const hadFavorite = !!oldFavorite;
            const hasFavorite = !!newFavorite;
            if (!hadFavorite && hasFavorite) {
                delta.entriesFavorites = (delta.entriesFavorites ?? 0) + 1;
            }
            else if (hadFavorite && !hasFavorite) {
                // This case might be redundant if cleanup logic is robust.
                // delta.entriesFavorites = (delta.entriesFavorites ?? 0) - 1;
            }
        }

        if (oldRedo !== newRedo) {
            delta.totalRedo = (delta.totalRedo ?? 0) + (newRedo - oldRedo);
        }

        if (oldState === null) {
            delta.totalEntries = (delta.totalEntries ?? 0) + 1;
            // Initial values are already handled by the logic above (e.g., adding time if status is watched)
        }

        if (Object.keys(delta.statusCounts!).length === 0) {
            delete delta.statusCounts;
        }

        return delta;
    }
}
