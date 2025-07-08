import {Status} from "@/lib/server/utils/enums";
import {notFound} from "@tanstack/react-router";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import type {DeltaStats} from "@/lib/server/types/stats.types";
import {IGamesService} from "@/lib/server/types/services.types";
import {IProviderService} from "@/lib/server/types/provider.types";
import {IGamesRepository} from "@/lib/server/types/repositories.types";
import {BaseService} from "@/lib/server/domain/media/base/base.service";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {Achievement, AchievementData} from "@/lib/server/types/achievements.types";
import {gamesAchievements} from "@/lib/server/domain/media/games/achievements.seed";
import {Game, GamesAchCodeName, GamesList} from "@/lib/server/domain/media/games/games.types";
import {GamesAdvancedStats, MediaAndUserDetails, UserMediaWithLabels} from "@/lib/server/types/base.types";


export class GamesService extends BaseService<
    Game, GamesList, GamesAdvancedStats, GamesAchCodeName, IGamesRepository
> implements IGamesService {
    readonly achievementHandlers: Record<GamesAchCodeName, (achievement: Achievement, userId?: number) => any>;

    constructor(repository: GamesRepository) {
        super(repository);

        this.achievementHandlers = {
            completed_games: this.repository.countCompletedAchievementCte.bind(this.repository),
            rated_games: this.repository.countRatedAchievementCte.bind(this.repository),
            comment_games: this.repository.countCommentedAchievementCte.bind(this.repository),
            hack_slash_games: this.repository.specificGenreAchievementCte.bind(this.repository),
            multiplayer_games: this.repository.getGameModeAchievementCte.bind(this.repository),
            log_hours_games: this.repository.getTimeSpentAchievementCte.bind(this.repository),
            platform_games: this.repository.getPlatformAchievementCte.bind(this.repository),
            pc_games: this.repository.getSpecificPlatformAchievementCte.bind(this.repository),
            short_games: this.repository.getDurationAchievementCte.bind(this.repository),
            long_games: this.repository.getDurationAchievementCte.bind(this.repository),
            developer_games: this.repository.getCompanyAchievementCte.bind(this.repository),
            publisher_games: this.repository.getCompanyAchievementCte.bind(this.repository),
            first_person_games: this.repository.getPerspectiveAchievementCte.bind(this.repository),
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
        const gameModes = await this.repository.gameModesCount(userId);
        const avgDuration = await this.repository.gameAvgPlaytime(userId);
        const durationDistrib = await this.repository.gamePlaytimeDistrib(userId);
        const {
            developersStats,
            publishersStats,
            platformsStats,
            enginesStats,
            perspectivesStats
        } = await this.repository.specificTopMetrics(userId);

        return {
            ratings,
            totalLabels,
            genresStats,
            releaseDates,
            avgDuration,
            durationDistrib,
            gameModes,
            developersStats,
            publishersStats,
            platformsStats,
            enginesStats,
            perspectivesStats,
        };
    }

    async getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: IProviderService) {
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

            const similarMedia = await this.repository.findSimilarMedia(mediaWithDetails.id)
            const userMedia = await this.repository.findUserMedia(userId, mediaWithDetails.id);
            const followsData = await this.repository.getUserFollowsMediaData(userId, mediaWithDetails.id);

            return {
                media: mediaWithDetails,
                userMedia,
                followsData,
                similarMedia,
            } as MediaAndUserDetails<Game, GamesList>;
        }

        throw notFound();
    }

    async getMediaEditableFields(mediaId: number) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const editableFields = this.repository.config.editableFields;
        const fields: { [key: string]: any } = {};

        for (const key in media) {
            //@ts-expect-error
            if (Object.prototype.hasOwnProperty.call(media, key) && editableFields.includes(key)) {
                //@ts-expect-error
                fields[key] = media[key];
            }
        }

        return { fields };
    }

    async updateMediaEditableFields(mediaId: number, payload: Record<string, any>) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const editableFields = this.repository.config.editableFields;
        const fields: { [key: string]: any } = {};
        fields.apiId = media.apiId;

        if (payload?.imageCover) {
            const imageName = await saveImageFromUrl({
                defaultName: "default.jpg",
                imageUrl: payload.imageCover,
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/games-covers",
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

        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (oldState) throw new Error("Media already in your list");

        const newState = await this.repository.addMediaToUserList(userId, media, newStatus);
        const delta = this.calculateDeltaStats(null, newState);

        return { newState, media, delta };
    }

    async updateUserMediaDetails(userId: number, mediaId: number, partialUpdateData: Record<string, any>) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) throw new Error("Media not in your list");

        const completeUpdateData = this.completePartialUpdateData(partialUpdateData);
        const newState = await this.repository.updateUserMediaDetails(userId, mediaId, completeUpdateData);
        const delta = this.calculateDeltaStats(oldState, newState);

        return {
            os: oldState,
            ns: newState,
            media,
            delta,
            updateData: completeUpdateData,
        };
    }

    async removeMediaFromUserList(userId: number, mediaId: number) {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) throw new Error("Media not in your list");

        await this.repository.removeMediaFromUserList(userId, mediaId);
        const delta = this.calculateDeltaStats(oldState, null);

        return delta;
    }

    completePartialUpdateData(partialUpdateData: Record<string, any>, _userMedia?: GamesList) {
        const completeUpdateData = { ...partialUpdateData };

        if (completeUpdateData.status && completeUpdateData.status === Status.PLAN_TO_PLAY) {
            return { ...completeUpdateData, playtime: 0 };
        }

        return completeUpdateData;
    }

    calculateDeltaStats(oldState: UserMediaWithLabels<GamesList> | null, newState: GamesList | null) {
        const delta: DeltaStats = {};
        const statusCounts: Partial<Record<Status, number>> = {};

        // Extract Old State Info
        const oldStatus = oldState?.status;
        const oldRating = oldState?.rating;
        const oldComment = oldState?.comment;
        const oldFavorite = oldState?.favorite ?? false;
        const oldTotalTimeSpent = oldState?.playtime ?? 0;
        const wasCompleted = oldStatus === Status.COMPLETED;
        const wasFavorited = wasCompleted && oldFavorite;
        const wasCommented = wasCompleted && !!oldComment;
        const wasRated = wasCompleted && oldRating != null;

        // Extract New State Info
        const newStatus = newState?.status;
        const newRating = newState?.rating;
        const newComment = newState?.comment;
        const newFavorite = newState?.favorite ?? false;
        const newTotalTimeSpent = newState?.playtime ?? 0;
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

        // Total Redo Count - Always 0 for Games
        delta.totalRedo = 0;

        // Total Specific - Always 0 for Games
        delta.totalSpecific = 0;

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
        return gamesAchievements as unknown as AchievementData[];
    }
}
