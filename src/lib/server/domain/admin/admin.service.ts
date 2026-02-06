import {MediaType} from "@/lib/utils/enums";
import {ErrorLog} from "@/lib/types/base.types";
import {SaveTaskToDb} from "@/lib/types/tasks.types";
import {SearchType} from "@/lib/types/zod.schema.types";
import {AdminRepository} from "@/lib/server/domain/admin/admin.repository";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";


export class AdminService {
    constructor(private repository: typeof AdminRepository) {
    }

    async saveErrorToDb(error: ErrorLog) {
        return this.repository.saveErrorToDb(error);
    }

    async getPaginatedErrorLogs(data: SearchType) {
        return this.repository.getPaginatedErrorLogs(data);
    }

    async deleteErrorLogs(errorIds: number[] | null) {
        return this.repository.deleteErrorLogs(errorIds);
    }

    async saveTaskToDb(data: SaveTaskToDb) {
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

    async getAdminUserTracking(userId: number) {
        return this.repository.getAdminUserTracking(userId);
    }

    async logMediaRefresh(params: { userId: number; mediaType: MediaType; apiId: number | string }) {
        return this.repository.logMediaRefresh(params);
    }

    async getMediaRefreshStats(days = 30, topLimit = 8, recentLimit = 12) {
        const [dailyByType, topUsers, totalsByRole, recentRefreshes] = await Promise.all([
            this.repository.getMediaRefreshDailyCountsByType(days),
            this.repository.getMediaRefreshTopUsers(days, topLimit),
            this.repository.getMediaRefreshTotalsByRole(days),
            this.repository.getRecentMediaRefreshes(recentLimit),
        ]);

        const buildDailySeriesByType = (days: number, mediaTypes: MediaType[], countsMap: Map<string, number>) => {
            const today = new Date();
            const utcBase = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

            return Array.from({ length: days }, (_value, idx) => {
                const date = new Date(utcBase);
                date.setUTCDate(utcBase.getUTCDate() - (days - 1 - idx));
                const key = date.toISOString().slice(0, 10);

                const entry: Record<string, number | string> = {
                    date: key,
                    total: 0,
                };

                for (const mediaType of mediaTypes) {
                    const value = countsMap.get(`${key}|${mediaType}`) ?? 0;
                    entry[mediaType] = value;
                    entry.total = Number(entry.total) + value;
                }

                return entry as { date: string; total: number } & Record<MediaType, number>;
            });
        };

        const mediaTypes = Object.values(MediaType);
        const countsByKey = new Map(dailyByType.map((row) => [`${row.date}|${row.mediaType}`, Number(row.count)]));
        const daily = buildDailySeriesByType(days, mediaTypes, countsByKey);
        const totalsByType = mediaTypes.map((mediaType) => ({
            mediaType,
            count: daily.reduce((sum, row) => sum + row[mediaType], 0),
        })).filter((row) => row.count > 0).sort((a, b) => b.count - a.count);
        const total = totalsByType.reduce((sum, row) => sum + row.count, 0);
        const uniqueUsers = totalsByRole.reduce((sum, row) => sum + Number(row.userCount ?? 0), 0);
        const busiest = daily.reduce((acc, row) => row.total > acc.total ? row : acc, daily[0] ?? { date: "", total: 0 });

        return {
            days,
            daily,
            topUsers,
            totalsByType,
            totalsByRole,
            recentRefreshes,
            summary: {
                total,
                busiestDay: busiest.date,
                busiestCount: busiest.total,
                uniqueUsers,
                avgPerDay: total ? Number((total / days).toFixed(1)) : 0,
            },
        };
    }
}
