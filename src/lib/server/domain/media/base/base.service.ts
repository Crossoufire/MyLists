import {JobType} from "@/lib/server/utils/enums";
import {IUniversalService} from "@/lib/server/types/services.types";
import {ICommonRepository} from "@/lib/server/types/repositories.types";
import {EditUserLabels, SearchType} from "@/lib/server/types/base.types";


export class BaseService<TMedia, TList, R extends ICommonRepository<TMedia, TList>> implements IUniversalService<TMedia, TList> {
    protected repository: R;

    constructor(repository: R) {
        this.repository = repository;
    }

    async findById(mediaId: number) {
        return this.repository.findById(mediaId);
    }

    async downloadMediaListAsCSV(userId: number) {
        return this.repository.downloadMediaListAsCSV(userId);
    }

    async searchByName(query: string) {
        return this.repository.searchByName(query);
    }

    async removeMediaByIds(mediaIds: number[]) {
        return this.repository.removeMediaByIds(mediaIds);
    }

    async getNonListMediaIds() {
        return this.repository.getNonListMediaIds();
    }

    async getCoverFilenames() {
        const coverFilenames = await this.repository.getCoverFilenames();
        return coverFilenames.map(({ imageCover }) => imageCover.split("/").pop() as string);
    }

    async getMediaToNotify() {
        return this.repository.getMediaToNotify();
    }

    async computeAllUsersStats() {
        return this.repository.computeAllUsersStats();
    }

    async computeTotalMediaLabel(userId?: number) {
        return this.repository.computeTotalMediaLabel(userId);
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

    async getMediaJobDetails(userId: number, job: JobType, name: string, search: SearchType) {
        const page = search.page ?? 1;
        const perPage = search.perPage ?? 25;
        const offset = (page - 1) * perPage;

        return this.repository.getMediaJobDetails(userId, job, name, offset, perPage);
    }

    async getSearchListFilters(userId: number, query: string, job: JobType) {
        return this.repository.getSearchListFilters(userId, query, job);
    }
}
