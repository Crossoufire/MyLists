import {eq, isNotNull} from "drizzle-orm";
import {notFound} from "@tanstack/react-router";
import {Status, UpdateType} from "@/lib/server/utils/enums";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {Achievement} from "@/lib/types/achievements.types";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {MangaSchemaConfig} from "@/lib/server/domain/media/books/books.config";
import {BooksRepository} from "@/lib/server/domain/media/books/books.repository";
import {Book, BooksAchCodeName, BooksList} from "@/lib/server/domain/media/books/books.types";
import {LogPayload, PagePayload, RedoPayload, StatsCTE, StatusPayload, UserMediaWithLabels} from "@/lib/types/base.types";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {DeltaStats} from "@/lib/types/stats.types";


export class BooksService extends BaseService<MangaSchemaConfig, BooksRepository> {
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
            [UpdateType.PAGE]: this.updatePageHandler.bind(this),
            [UpdateType.REDO]: this.updateRedoHandler.bind(this),
            [UpdateType.STATUS]: this.updateStatusHandler.bind(this),
        }
    }

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

    async getMediaEditableFields(mediaId: number) {
        const media = await this.repository.findAllAssociatedDetails(mediaId);
        if (!media) throw notFound();

        const editableFields = this.repository.config.editableFields;
        const fields: Record<string, any> = {};

        editableFields.forEach((field) => {
            if (field in media) {
                fields[field] = media[field as keyof typeof media];
            }
        });

        fields.genres = media.genres;
        fields.allGenres = this.getAvailableGenres();

        return { fields };
    }

    async updateMediaEditableFields(mediaId: number, payload: Record<string, any>) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const { genres, ...mediaData } = payload;

        if (genres && !Array.isArray(genres)) {
            throw new Error("Genres must be an array");
        }

        const editableFields = this.repository.config.editableFields;
        const fieldsToUpdate = {} as Record<Partial<keyof Book>, any>;
        fieldsToUpdate.apiId = media.apiId;

        if (mediaData?.imageCover) {
            const imageName = await saveImageFromUrl({
                imageUrl: mediaData.imageCover,
                dirSaveName: "books-covers",
            });
            fieldsToUpdate.imageCover = imageName;
            delete mediaData.imageCover;
        }

        for (const key in mediaData) {
            if (Object.prototype.hasOwnProperty.call(mediaData, key) && editableFields.includes(key as keyof Book)) {
                fieldsToUpdate[key as keyof typeof media] = mediaData[key as keyof typeof media];
            }
        }

        await this.repository.updateMediaWithDetails({ mediaData: fieldsToUpdate, genresData: genres });
    }

    calculateDeltaStats(oldState: UserMediaWithLabels<BooksList> | null, newState: BooksList | null, _media: Book) {
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

    getAvailableGenres() {
        return [
            "Action & Adventure", "Biography", "Chick lit", "Children", "Classic", "Crime", "Drama",
            "Dystopian", "Essay", "Fantastic", "Fantasy", "Historical Fiction", "History", "Humor", "Horror",
            "Literary Novel", "Memoirs", "Mystery", "Paranormal", "Philosophy", "Poetry", "Romance", "Science",
            "Science-Fiction", "Short story", "Suspense", "Testimony", "Thriller", "Western", "Young adult"
        ].map((name) => ({ name }));
    }

    updateRedoHandler(currentState: BooksList, payload: RedoPayload, media: Book): [BooksList, LogPayload] {
        const newState = { ...currentState, redo: payload.redo };
        const logPayload = { oldValue: currentState.redo, newValue: payload.redo };

        newState.total = media.pages + (payload.redo * media.pages);

        return [newState, logPayload];
    }

    updateStatusHandler(currentState: BooksList, payload: StatusPayload, media: Book): [BooksList, LogPayload] {
        const newState = { ...currentState, status: payload.status };
        const logPayload = { oldValue: currentState.status, newValue: payload.status };

        if (payload.status === Status.COMPLETED) {
            newState.total = media.pages;
            newState.actualPage = media.pages;
        }
        else if (payload.status === Status.PLAN_TO_READ) {
            newState.redo = 0;
            newState.total = 0;
            newState.actualPage = 0;
        }

        return [newState, logPayload];
    }

    updatePageHandler(currentState: BooksList, payload: PagePayload, media: Book): [BooksList, LogPayload] {
        if (payload.actualPage > media.pages) {
            throw new FormattedError("Invalid page");
        }

        const newState = { ...currentState, actualPage: payload.actualPage };
        const logPayload = { oldValue: currentState.actualPage, newValue: payload.actualPage };

        newState.total = payload.actualPage + (currentState.redo * media.pages);

        return [newState, logPayload];
    }
}
