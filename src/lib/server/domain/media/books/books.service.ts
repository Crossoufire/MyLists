import {eq, isNotNull} from "drizzle-orm";
import {notFound} from "@tanstack/react-router";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import type {DeltaStats} from "@/lib/server/types/stats.types";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {MediaType, Status, UpdateType} from "@/lib/server/utils/enums";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {StatsCTE, UserMediaWithLabels} from "@/lib/server/types/base.types";
import {BooksSchemaConfig} from "@/lib/server/domain/media/books/books.config";
import {BooksRepository} from "@/lib/server/domain/media/books/books.repository";
import {Achievement, AchievementData} from "@/lib/server/types/achievements.types";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {booksAchievements} from "@/lib/server/domain/media/books/achievements.seed";
import {Book, BooksAchCodeName, BooksList} from "@/lib/server/domain/media/books/books.types";


export class BooksService extends BaseService<BooksSchemaConfig, BooksRepository> {
    readonly achievementHandlers: Record<BooksAchCodeName, (achievement: Achievement, userId?: number) => StatsCTE>;

    constructor(repository: BooksRepository) {
        super(repository);

        const { listTable } = this.repository.config;

        this.achievementHandlers = {
            completed_books: this.repository.countAchievementCte.bind(this.repository, eq(listTable.status, Status.COMPLETED)),
            rated_books: this.repository.countAchievementCte.bind(this.repository, isNotNull(listTable.rating)),
            comment_books: this.repository.countAchievementCte.bind(this.repository, isNotNull(listTable.comment)),
            long_books: this.repository.getDurationAchievementCte.bind(this.repository),
            short_books: this.repository.getDurationAchievementCte.bind(this.repository),
            author_books: this.repository.getAuthorsAchievementCte.bind(this.repository),
            lang_books: this.repository.getLanguageAchievementCte.bind(this.repository),
            classic_books: this.repository.specificGenreAchievementCte.bind(this.repository),
            young_adult_books: this.repository.specificGenreAchievementCte.bind(this.repository),
            crime_books: this.repository.specificGenreAchievementCte.bind(this.repository),
            fantasy_books: this.repository.specificGenreAchievementCte.bind(this.repository),
        };

        this.updateHandlers = {
            ...this.updateHandlers,
            [UpdateType.REDO]: this.updateRedoHandler,
            [UpdateType.STATUS]: this.updateStatusHandler,
        }
    }

    // --- Implements Methods --------------------------------------------------------

    async calculateAdvancedMediaStats(userId?: number) {
        // If userId not provided, calculations are platform-wide

        const { ratings, genresStats, totalLabels, releaseDates } = await super.calculateAdvancedMediaStats(userId);

        // Specific stats
        const avgDuration = await this.repository.avgBooksDuration(userId);
        const durationDistrib = await this.repository.booksDurationDistrib(userId);
        const { publishersStats, authorsStats, langsStats } = await this.repository.specificTopMetrics(userId);

        return {
            ratings,
            totalLabels,
            genresStats,
            releaseDates,
            avgDuration,
            durationDistrib,
            publishersStats,
            authorsStats,
            langsStats,
        };
    }

    async getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: BaseProviderService<any>) {
        const media = external ?
            await this.repository.findByApiId(mediaId) : await this.repository.findById(mediaId as number);

        let internalMediaId = media?.id;
        if (external && !internalMediaId) {
            internalMediaId = await providerService.fetchAndStoreMediaDetails(mediaId as unknown as number);
            if (!internalMediaId) throw new Error("Failed to fetch media details");
        }

        if (internalMediaId) {
            const mediaWithDetails = await this.repository.findAllAssociatedDetails(internalMediaId);
            if (!mediaWithDetails) throw notFound();

            const similarMedia = await this.repository.findSimilarMedia(mediaWithDetails.id);
            const userMedia = await this.repository.findUserMedia(userId, mediaWithDetails.id);
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
        if (!media) throw notFound();

        const editableFields = this.repository.config.editableFields;
        const fields = {} as Record<Partial<keyof Book>, any>;
        fields.apiId = media.apiId;

        if (payload?.imageCover) {
            const imageName = await saveImageFromUrl({
                defaultName: "default.jpg",
                imageUrl: payload.imageCover,
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/books-covers",
            });
            fields.imageCover = imageName;
            delete payload.imageCover;
        }

        for (const key in payload) {
            if (Object.prototype.hasOwnProperty.call(payload, key) && editableFields.includes(key as keyof Book)) {
                fields[key as keyof typeof media] = payload[key as keyof typeof media];
            }
        }

        await this.repository.updateMediaWithDetails({ mediaData: fields });
    }

    async addMediaToUserList(userId: number, mediaId: number, status?: Status) {
        const newStatus = status ?? this.repository.config.mediaList.defaultStatus;

        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const userMedia = await this.repository.findUserMedia(userId, mediaId);
        if (userMedia) throw new FormattedError("Media already in your list");

        const newState = await this.repository.addMediaToUserList(userId, media, newStatus);
        const delta = this.calculateDeltaStats(null, newState, media);

        return { newState, media, delta };
    }

    async removeMediaFromUserList(userId: number, mediaId: number) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) throw new FormattedError("Media not in your list");

        await this.repository.removeMediaFromUserList(userId, mediaId);
        const delta = this.calculateDeltaStats(oldState, null, media);

        return delta;
    }

    calculateDeltaStats(oldState: UserMediaWithLabels<BooksList> | null, newState: BooksList | null, media: Book) {
        const delta: DeltaStats = {};
        const statusCounts: Partial<Record<Status, number>> = {};

        // TODO: Check how to avoid magic number 1.7

        // Extract Old State Info
        const oldStatus = oldState?.status;
        const oldRating = oldState?.rating;
        const oldRedo = oldState?.redo ?? 0;
        const oldComment = oldState?.comment;
        const oldFavorite = oldState?.favorite ?? false;
        const oldTotalSpecificValue = oldState?.total ?? 0;
        const oldTotalTimeSpent = oldTotalSpecificValue * 1.7;
        const wasCompleted = oldStatus === Status.COMPLETED;
        const wasFavorited = wasCompleted && oldFavorite;
        const wasCommented = wasCompleted && !!oldComment;
        const wasRated = wasCompleted && oldRating != null;

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
        const newTotalSpecificValue = newState?.total ?? 0;
        const newTotalTimeSpent = newTotalSpecificValue * 1.7;

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

    getAchievementsDefinition(_mediaType?: MediaType) {
        return booksAchievements as unknown as AchievementData[];
    }

    // ------

    updateRedoHandler(currentState: BooksList, payload: { type: typeof UpdateType.REDO, redo: number }, _media: Book) {
        const newState = { ...currentState, redo: payload.redo };
        const logPayload = { oldValue: currentState.redo, newValue: payload.redo };

        newState.total = 0;

        return [newState, logPayload];
    }

    updateStatusHandler(currentState: BooksList, payload: { type: typeof UpdateType.REDO, status: Status }, media: Book) {
        const newState = { ...currentState, status: payload.status };
        const logPayload = { oldValue: currentState.status, newValue: payload.status };

        if (payload.status === Status.COMPLETED) {
            newState.actualPage = media.pages;
        }
        else if (payload.status === Status.PLAN_TO_READ) {
            newState.actualPage = 0;
        }

        return [newState, logPayload];
    }
}
