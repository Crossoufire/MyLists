import {Status} from "@/lib/server/utils/enums";
import {MediaRepoRegistry} from "@/lib/server/registries/media-repo.registry";
import {UserStatsRepository} from "@/lib/server/repositories/user/user-stats.repository";


export class UserStatsService {
    constructor(
        private userStatsRepository: typeof UserStatsRepository,
        private mediaRegistry: typeof MediaRepoRegistry,
    ) {
        this.mediaRegistry = mediaRegistry;
        this.userStatsRepository = userStatsRepository;
    }

    async getGlobalStats(userId: number) {
        const activeSettings = await this.userStatsRepository.getActiveSettings(userId);

        // Time [h] per media
        const timePerMedia = activeSettings.map((setting) => setting.timeSpent / 60);

        // Total media time [h]
        const totalHours = timePerMedia.reduce((sum, time) => sum + time, 0);

        // Total entries
        const totalEntries = activeSettings.reduce((sum, setting) => sum + setting.totalEntries, 0);

        // Total entries - no plan
        const excludedStatuses = Status.getNoPlanTo();
        const totalEntriesNoPlan = activeSettings.reduce((sum, setting) => {
            let settingSum = 0;
            Object.entries(setting.statusCounts).forEach(([status, count]) => {
                if (!excludedStatuses.includes(status as Status)) {
                    settingSum += count;
                }
            });
            return sum + settingSum;
        }, 0);

        // Total and percentage rated
        const totalRated = activeSettings.reduce((sum, setting) => sum + setting.entriesRated, 0);
        const percentRated = totalEntriesNoPlan === 0 ? 0 : (totalRated / totalEntriesNoPlan) * 100;

        // Total avg rating
        const avgRated = totalRated === 0 ? 0 : activeSettings.reduce((sum, s) => sum + s.sumEntriesRated, 0) / totalRated;

        const data = {
            totalHours: Math.floor(totalHours),
            totalDays: Math.round(totalHours / 24),
            totalEntries,
            totalEntriesNoPlan,
            timePerMedia,
            totalRated,
            percentRated,
            avgRated,
            mediaTypes: activeSettings.map((setting) => setting.mediaType),
        };

        return data;
    }

    async getSummaryStats(userId: number, limit = 10) {
        const excludedStatuses = Status.getNoPlanTo();
        const activeSettings = await this.userStatsRepository.getActiveSettings(userId);

        const data = [];
        for (const setting of activeSettings) {
            let totalNoPlan = 0;
            Object.entries(setting.statusCounts).forEach(([status, count]) => {
                if (!excludedStatuses.includes(status as Status)) {
                    totalNoPlan += count;
                }
            });

            const mediaRepository = this.mediaRegistry.getRepository(setting.mediaType);
            const favoritesMedia = await mediaRepository.getUserFavorites(userId, limit);

            const statusList = Object.entries(setting.statusCounts).map(([status, count]) =>
                ({ status, count, percent: (count / setting.totalEntries) * 100 })
            );

            const summary = {
                mediaType: setting.mediaType,
                totalSpecific: setting.totalSpecific,
                timeSpent: Math.floor(setting.timeSpent / 60),
                timeSpentDays: Math.floor(setting.timeSpent / 1440),
                totalEntries: setting.totalEntries,
                totalNoPlan: totalNoPlan,
                noData: setting.totalEntries === 0,
                statusList: statusList,
                favoritesList: favoritesMedia,
                EntriesFavorites: setting.entriesFavorites,
                entriesRated: setting.entriesRated,
                percentRated: setting.entriesRated / totalNoPlan,
                avgRated: setting.averageRating,
            };

            data.push(summary);
        }

        return data;
    }
}
