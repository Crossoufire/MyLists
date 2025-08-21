import {Label} from "@/lib/components/types";
import {notFound} from "@tanstack/react-router";
import {DeltaStats} from "@/lib/server/types/stats.types";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {Achievement, AchievementData} from "@/lib/server/types/achievements.types";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {JobType, LabelAction, MediaType, Status, UpdateType} from "@/lib/server/utils/enums";
import {GenreTable, LabelTable, ListTable, MediaSchemaConfig, MediaTable} from "@/lib/server/types/media-lists.types";
import {MediaAndUserDetails, MediaListArgs, SearchType, UpdateHandlerFn, UpdateUserMedia, UpdateUserMediaDetails, UserMediaWithLabels} from "@/lib/server/types/base.types";


export abstract class BaseService<
    TConfig extends MediaSchemaConfig<MediaTable, ListTable, GenreTable, LabelTable>,
    R extends BaseRepository<TConfig>
> {
    protected repository: R;
    protected updateHandlers: Partial<Record<UpdateType, (currentState: any, payload: any, media: any) => any>>;
    protected abstract readonly achievementHandlers: Record<any, (achievement: Achievement, userId?: number) => any>;

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

    async getNonListMediaIds() {
        return this.repository.getNonListMediaIds();
    }

    async getUpcomingMedia(userId?: number, maxAWeek?: boolean,) {
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
        const perPage = search.perPage ?? 25;
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
        const [completeNewData, logPayload] = updateHandler(oldState, payload, media);

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

    getAchievementCte(achievement: Achievement, userId?: number) {
        const handler = this.achievementHandlers[achievement.codeName as string];
        if (!handler) {
            throw new Error(`Invalid Achievement codeName: ${achievement.codeName}`);
        }
        return handler(achievement, userId);
    }

    createSimpleUpdateHandler = <K extends string>(propName: K): UpdateHandlerFn<any, any, any> => (currentState, payload) => {
        const newState = { ...currentState, [propName]: payload[propName] };
        return [newState, null];
    };

    // --- Abstract Methods --------------------------------------------------------------------

    abstract getAchievementsDefinition(mediaType?: MediaType): AchievementData[];

    abstract getMediaEditableFields(mediaId: number): Promise<{ fields: Record<string, any> }>

    abstract updateMediaEditableFields(mediaId: number, payload: Record<string, any>): Promise<void>;

    abstract calculateDeltaStats(oldState: UserMediaWithLabels<any>, newState: any, media: any): DeltaStats;

    abstract getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: BaseProviderService<any>): Promise<MediaAndUserDetails<any, any>>;
}
