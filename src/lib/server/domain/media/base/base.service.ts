import {notFound} from "@tanstack/react-router";
import {DeltaStats} from "@/lib/types/stats.types";
import {Achievement} from "@/lib/types/achievements.types";
import {FormattedError} from "@/lib/utils/error-classes";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {JobType, LabelAction, Status, UpdateType} from "@/lib/utils/enums";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {MediaListArgs, SearchType, UpdateUserMedia} from "@/lib/types/zod.schema.types";
import {Label, UpdateHandlerFn, UpdateUserMediaDetails, UserMediaWithLabels} from "@/lib/types/base.types";
import {GenreTable, LabelTable, ListTable, MediaSchemaConfig, MediaTable} from "@/lib/types/media.config.types";


export abstract class BaseService<
    TConfig extends MediaSchemaConfig<MediaTable, ListTable, GenreTable, LabelTable>,
    R extends BaseRepository<TConfig>
> {
    protected repository: R;
    protected abstract readonly achievementHandlers: Record<any, (achievement: Achievement, userId?: number) => any>;
    protected updateHandlers: Partial<Record<UpdateType, UpdateHandlerFn<TConfig["listTable"]["$inferSelect"], any, TConfig["mediaTable"]["$inferSelect"]>>>;

    protected constructor(repository: R) {
        this.repository = repository;

        // User progress handlers based on update type
        this.updateHandlers = {
            [UpdateType.RATING]: this.createSimpleUpdateHandler("rating"),
            [UpdateType.COMMENT]: this.createSimpleUpdateHandler("comment"),
            [UpdateType.FAVORITE]: this.createSimpleUpdateHandler("favorite"),
        }
    }

    async getCoverFilenames() {
        const coverFilenames = await this.repository.getCoverFilenames();
        return coverFilenames.map(({ imageCover }) => imageCover.split("/").pop() as string);
    }

    async getUserFavorites(userId: number, limit = 8) {
        return this.repository.getUserFavorites(userId, limit);
    }

    async getNonListMediaIds() {
        return this.repository.getNonListMediaIds();
    }

    async getUpcomingMedia(userId?: number, maxAWeek?: boolean) {
        return this.repository.getUpcomingMedia(userId, maxAWeek);
    }

    async computeAllUsersStats() {
        return this.repository.computeAllUsersStats();
    }

    async searchByName(query: string) {
        return this.repository.searchByName(query);
    }

    async removeMediaByIds(mediaIds: number[]) {
        return this.repository.removeMediaByIds(mediaIds);
    }

    async getListFilters(userId: number) {
        return this.repository.getListFilters(userId);
    }

    async computeTotalMediaLabel(userId?: number) {
        return this.repository.computeTotalMediaLabel(userId);
    }

    async getUserMediaLabels(userId: number) {
        return await this.repository.getUserMediaLabels(userId);
    }

    async findById(mediaId: number) {
        return this.repository.findById(mediaId);
    }

    async downloadMediaListAsCSV(userId: number) {
        return this.repository.downloadMediaListAsCSV(userId);
    }

    async calculateAdvancedMediaStats(userId?: number) {
        // If userId not provided, calculations are platform-wide

        // Specific media stats but calculation common
        const ratings = await this.repository.computeRatingStats(userId);
        const genresStats = await this.repository.computeTopGenresStats(userId);
        const totalLabels = await this.repository.computeTotalMediaLabel(userId);
        const releaseDates = await this.repository.computeReleaseDateStats(userId);

        return { ratings, genresStats, totalLabels, releaseDates };
    }

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        return this.repository.getSearchListFilters(userId, query, job);
    }

    async getMediaJobDetails(userId: number, job: JobType, name: string, search: SearchType) {
        const page = search.page ?? 1;
        const perPage = search.perPage ?? 24;
        const offset = (page - 1) * perPage;

        return this.repository.getMediaJobDetails(userId, job, name, offset, perPage);
    }

    async editUserLabel(userId: number, label: Label, mediaId: number, action: LabelAction) {
        return this.repository.editUserLabel(userId, label, mediaId, action);
    }

    async getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs) {
        return this.repository.getMediaList(currentUserId, userId, args);
    }

    async addMediaToUserList(userId: number, mediaId: number, status?: Status) {
        const newStatus = status ?? this.repository.config.mediaList.defaultStatus;

        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (oldState) throw new FormattedError("Media already in your list");

        const newState = await this.repository.addMediaToUserList(userId, media, newStatus);
        const delta = this.calculateDeltaStats(null, newState, media);

        const logPayload = { oldValue: null, newValue: newState.status };

        return {
            media,
            delta,
            newState,
            logPayload,
        };
    }

    async updateUserMediaDetails(userId: number, mediaId: number, payload: UpdateUserMedia["payload"]): Promise<UpdateUserMediaDetails<any, any>> {
        const media = await this.repository.findById(mediaId);
        if (!media) throw notFound();

        const oldState = await this.repository.findUserMedia(userId, mediaId);
        if (!oldState) throw new FormattedError("Media not in your list");

        const updateHandler = this.updateHandlers[payload.type];
        if (!updateHandler) throw new Error(`No handler found for command type: ${payload.type}`);
        const [completeNewData, logPayload] = await updateHandler(oldState, payload, media);

        const newState = await this.repository.updateUserMediaDetails(userId, mediaId, completeNewData);
        const delta = this.calculateDeltaStats(oldState, newState, media);

        return {
            media,
            delta,
            newState,
            logPayload,
        };
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

    async getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: BaseProviderService<any, any, any>) {
        const media = external ? await this.repository.findByApiId(mediaId) : await this.repository.findById(mediaId as number);

        let internalMediaId = media?.id;
        if (external && !internalMediaId) {
            internalMediaId = await providerService.fetchAndStoreMediaDetails(mediaId as unknown as number);
        }

        if (internalMediaId) {
            const mediaWithDetails = await this.repository.findAllAssociatedDetails(internalMediaId);
            if (!mediaWithDetails) {
                throw notFound();
            }

            const similarMedia = await this.repository.findSimilarMedia(mediaWithDetails.id);
            const userMedia = await this.repository.findUserMedia(userId, mediaWithDetails.id);
            const followsData = await this.repository.getUserFollowsMediaData(userId, mediaWithDetails.id);

            return {
                userMedia,
                followsData,
                similarMedia,
                media: mediaWithDetails,
            };
        }

        throw notFound();
    }

    getAchievementCte(achievement: Achievement, userId?: number) {
        const handler = this.achievementHandlers[achievement.codeName];
        if (!handler) {
            throw new Error(`Invalid Achievement codeName: ${achievement.codeName}`);
        }
        return handler(achievement, userId);
    }

    createSimpleUpdateHandler<K extends string>(propName: K): UpdateHandlerFn<any, any, any> {
        return (currentState, payload) => {
            const newState = { ...currentState, [propName]: payload[propName] };
            return [newState, null];
        };
    }

    getAchievementsDefinition() {
        return this.repository.config.achievements;
    }

    // --- Admin Methods ---------------------------------------------------

    async getAdminUserMediaAddedAndUpdated() {
        return this.repository.getAdminUserMediaAddedAndUpdated();
    }

    // --- Abstract Methods ------------------------------------------------

    abstract getMediaEditableFields(mediaId: number): Promise<{ fields: Record<string, any> }>

    abstract updateMediaEditableFields(mediaId: number, payload: Record<string, any>): Promise<void>;

    abstract calculateDeltaStats(oldState: UserMediaWithLabels<any>, newState: any, media: any): DeltaStats;
}
