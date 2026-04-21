import {MediaType} from "@/lib/utils/enums";
import {ErrorLog} from "@/lib/types/base.types";
import {SaveTaskToDb} from "@/lib/types/tasks.types";
import {SearchType} from "@/lib/types/zod.schema.types";
import {MediaRefreshStatsParams} from "@/lib/types/admin.types";
import {AdminRepository} from "@/lib/server/domain/admin/admin.repository";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";


const buildDailySeriesByType = (startDate: Date, endDate: Date, mediaTypes: MediaType[], countsMap: Map<string, number>) => {
    const days = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);

    return Array.from({ length: days }, (_value, idx) => {
        const date = new Date(startDate);
        date.setUTCDate(startDate.getUTCDate() + idx);
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

    async logMediaRefresh(params: { userId: number; mediaType: MediaType; apiId: number | string }) {
        return this.repository.logMediaRefresh(params);
    }

    async getMediaRefreshStats({ dailyRange = "30d", topRange = "all", recentPage = 1 }: MediaRefreshStatsParams = {}) {
        const mediaRefreshRangeDays = { "30d": 30, "90d": 90, "1y": 365, all: null };

        const mediaTypes = Object.values(MediaType);
        const topDays = mediaRefreshRangeDays[topRange];
        const dailyDays = mediaRefreshRangeDays[dailyRange];
        const today = new Date(new Date().setUTCHours(0, 0, 0, 0));

        const [dailyByType, topUsers, totalsByRole, totalsByType, summary, recentRefreshes] = await Promise.all([
            this.repository.getMediaRefreshDailyCountsByType(dailyDays),
            this.repository.getMediaRefreshTopUsers(topDays),
            this.repository.getMediaRefreshTotalsByRole(),
            this.repository.getMediaRefreshTotalsByType(),
            this.repository.getMediaRefreshSummary(),
            this.repository.getRecentMediaRefreshes(recentPage),
        ]);

        const countsByKey = new Map(dailyByType.map((row) => [`${row.date}|${row.mediaType}`, Number(row.count)]));

        const dailyStartDate = (dailyRange === "all")
            ? (summary.firstRefreshDate ? new Date(`${summary.firstRefreshDate}T00:00:00.000Z`) : null)
            : new Date(today.getTime() - ((dailyDays ?? 1) - 1) * 24 * 60 * 60 * 1000);
        const daily = dailyStartDate ? buildDailySeriesByType(dailyStartDate, today, mediaTypes, countsByKey) : [];

        const normalizedTotalsByType = mediaTypes
            .map((mediaType) => ({
                mediaType,
                count: Number(totalsByType.find((row) => row.mediaType === mediaType)?.count ?? 0),
            }))
            .filter((row) => row.count > 0).sort((a, b) => b.count - a.count);

        const activeDays = summary.firstRefreshDate
            ? Math.max(1, Math.floor((today.getTime() - new Date(`${summary.firstRefreshDate}T00:00:00.000Z`).getTime()) / (24 * 60 * 60 * 1000)) + 1)
            : 0;

        return {
            daily,
            topRange,
            topUsers,
            dailyRange,
            totalsByRole,
            recentRefreshes,
            dailyWindowDays: daily.length,
            totalsByType: normalizedTotalsByType,
            summary: {
                total: summary.total,
                busiestDay: summary.busiestDay,
                uniqueUsers: summary.uniqueUsers,
                busiestCount: summary.busiestCount,
                avgPerDay: summary.total && activeDays ? Number((summary.total / activeDays).toFixed(1)) : 0,
            },
        };
    }
}
