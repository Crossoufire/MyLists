import {MediaType} from "@/lib/utils/enums";
import {ErrorLog} from "@/lib/types/base.types";
import {SaveToDbProps} from "@/lib/types/tasks.types";
import {AdminRepository} from "@/lib/server/domain/admin/admin.repository";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";


export class AdminService {
    constructor(private repository: typeof AdminRepository) {
    }

    async saveErrorToDb(error: ErrorLog) {
        return this.repository.saveErrorToDb(error);
    }

    async getErrorLogs() {
        return this.repository.getErrorLogs();
    }

    async deleteErrorLog(errorId: number) {
        return this.repository.deleteErrorLog(errorId);
    }

    async saveTaskToDb(data: SaveToDbProps) {
        return this.repository.saveTaskToDb(data);
    }

    async getArchivedTasksForAdmin() {
        return this.repository.getArchivedTasksForAdmin();
    }

    async deleteArchivedTaskForAdmin(taskId: string) {
        return this.repository.deleteArchivedTaskForAdmin(taskId);
    }

    async getMediaOverviewForAdmin(mediaServiceRegistry: typeof MediaServiceRegistry) {
        const mediaStats = await Promise.all(Object.values(MediaType).map(async (mediaType) => {
            const mediaService = mediaServiceRegistry.getService(mediaType);
            const { added, updated } = await mediaService.getUserMediaAddedAndUpdatedForAdmin();
            return { mediaType, added, updated };
        }));

        const addedThisMonth = mediaStats.reduce((sum, { added }) => sum + added.thisMonth, 0);
        const addedLastMonth = mediaStats.reduce((sum, { added }) => sum + added.lastMonth, 0);
        const updatedThisMonth = mediaStats.reduce((sum, { updated }) => sum + updated.thisMonth, 0);

        return {
            addedThisMonth,
            addedLastMonth,
            updatedThisMonth,
            addedComparedToLastMonth: addedThisMonth - addedLastMonth,
            addedPerMediaType: mediaStats.map(({ mediaType, added }) => ({ mediaType, ...added })),
            updatedPerMediaType: mediaStats.map(({ mediaType, updated }) => ({ mediaType, ...updated })),
        };
    }
}
