import { MediaType, Status } from "@/lib/server/utils/enums";
import { MediaRegistry } from "@/lib/server/registries/media.registry";
import { UserStatsRepository } from "@/lib/server/repositories/user/user-stats.repository";


export class UserStatsService {
    constructor(
        private userStatsRepository: typeof UserStatsRepository,
        private mediaRegistry: typeof MediaRegistry
    ) { }

    async getGlobalStats(userId: string) {
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
            //@ts-ignore
            for (const k in setting.statusCounts) {
                //@ts-ignore
                // noinspection JSUnfilteredForInLoop
                if (!excludedStatuses.includes(k as Status)) {
                    //@ts-ignore
                    // noinspection JSUnfilteredForInLoop
                    settingSum += setting.statusCounts[k];
                }
            }
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
            mediaTypes: activeSettings.map((setting) => setting.mediaType as MediaType),
        };

        return data;
    }

    async getSummaryStats(userId: string, limit = 10) {
        const activeSettings = await this.userStatsRepository.getActiveSettings(userId);
        const excludedStatuses = Status.getNoPlanTo();

        const data = [];
        for (const setting of activeSettings) {
            let totalNoPlan = 0;
            // @ts-ignore
            for (const status in setting.statusCounts) {
                //@ts-ignore
                if (!excludedStatuses.includes(status)) {
                    //@ts-ignore
                    totalNoPlan += setting.statusCounts[status];
                }
            }

            const mediaRepository = this.mediaRegistry.getRepository(setting.mediaType as MediaType);
            // @ts-ignore
            const favoritesMedia = await mediaRepository.getUserFavorites(userId, limit);

            const statusList = Object.entries(setting.statusCounts).map(([status, count]) =>
                // @ts-ignore
                ({ status, count, percent: count / setting.totalEntries })
            );

            const favoritesList = favoritesMedia.map(
                (favorite: any) => ({
                    mediaName: favorite.media.name,
                    mediaId: favorite.mediaId,
                    mediaCover: favorite.media.mediaCover,
                })
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
                favoritesList: favoritesList,
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
