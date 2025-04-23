import {StatsDelta} from "@/lib/server/types/stats.types";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {MediaRepoRegistry} from "@/lib/server/domain/media/base/base.registry";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";


export class UserStatsService {
    constructor(
        private repository: typeof UserStatsRepository,
        private mediaRepoRegistry: typeof MediaRepoRegistry,
        private achievementsRepository: typeof AchievementsRepository,
        private userUpdatesRepository: typeof UserUpdatesRepository,
    ) {
    }

    async getGlobalStats(userId: number) {
        const activeSettings = await this.repository.getActiveSettings(userId);

        const timePerMedia = activeSettings.map((setting) => setting.timeSpent / 60);
        const totalHours = timePerMedia.reduce((sum, time) => sum + time, 0);
        const totalEntries = activeSettings.reduce((sum, setting) => sum + setting.totalEntries, 0);
        const totalFavorites = activeSettings.reduce((sum, setting) => sum + setting.entriesFavorites, 0);
        const totalComments = activeSettings.reduce((sum, setting) => sum + setting.entriesCommented, 0);
        const totalRedo = activeSettings.reduce((sum, setting) => sum + setting.totalRedo, 0);

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
        const avgRated = totalRated === 0 ? 0 : activeSettings.reduce((sum, s) => sum + s.sumEntriesRated, 0) / totalRated;
        const avgComments = totalComments === 0 ? 0 : totalComments / activeSettings.length;
        const avgFavorites = totalFavorites === 0 ? 0 : totalFavorites / activeSettings.length;

        return {
            totalEntries,
            totalFavorites,
            totalComments,
            totalEntriesNoPlan,
            timePerMedia,
            totalRated,
            percentRated,
            avgRated,
            avgComments,
            avgFavorites,
            totalRedo,
            totalHours: Math.floor(totalHours),
            totalDays: Math.round(totalHours / 24),
            mediaTypes: activeSettings.map((setting) => setting.mediaType),
        };
    }

    async getSummaryStats(userId: number, _limit = 10) {
        const excludedStatuses = Status.getNoPlanTo();
        const activeSettings = await this.repository.getActiveSettings(userId);

        const data = [];
        for (const setting of activeSettings) {
            let totalNoPlan = 0;
            Object.entries(setting.statusCounts).forEach(([status, count]) => {
                if (!excludedStatuses.includes(status as Status)) {
                    totalNoPlan += count;
                }
            });

            // const mediaRepository = this.mediaRegistry.getRepository(setting.mediaType);
            // const favoritesMedia = await mediaRepository.getUserFavorites(userId, limit);

            const favoritesMedia: any[] = []

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

    async updateDeltaUserStats(userId: number, mediaType: MediaType, delta: StatsDelta) {
        await this.repository.updateDeltaUserStats(userId, mediaType, delta);
    }

    async getUserMediaStats(userId: number) {
        const statsFromSettings = await this.getGlobalStats(userId);

        const updatesPerMonth = await this.userUpdatesRepository.getUpdatesCountPerMonth(userId);
        const platinumAchievements = await this.achievementsRepository.countPlatinumAchievements(userId);
        const labelCountPromises = statsFromSettings.mediaTypes.map((mediaType) => {
            const mediaRepository = this.mediaRepoRegistry.getRepository(mediaType);
            return mediaRepository.getTotalMediaLabel(userId);
        });
        const labelCounts = await Promise.all(labelCountPromises);
        const totalLabels = labelCounts.reduce((sum, count) => sum + count, 0);

        return { ...statsFromSettings, totalLabels, platinumAchievements, updatesPerMonth };
    }

    async getSpecificMediaTypeStats(userId: number, mediaType: MediaType) {
        const mediaRepository = this.mediaRepoRegistry.getRepository(mediaType);
        const commonStats = await this.computeCommonMediaStats(userId, mediaType);
        const updatesStats = await this.userUpdatesRepository.getMediaUpdatesCountPerMonth(userId, mediaType);
        const specificStats = await mediaRepository.calculateSpecificStats(userId);

        return { ...commonStats, ...updatesStats, ...specificStats };
    }

    private async computeCommonMediaStats(userId: number, mediaType: MediaType) {
        const setting = await this.repository.getSpecificSetting(userId, mediaType);

        const totalEntries = setting.totalEntries;
        const totalRedo = setting.totalRedo;
        const timeSpentHours = setting.timeSpent / 60
        const timeSpentDays = Math.round(timeSpentHours / 24);
        const totalRated = setting.entriesRated;
        const avgRated = totalRated === 0 ? 0 : setting.sumEntriesRated / totalRated;
        const totalFavorites = setting.entriesFavorites;
        const totalComments = setting.entriesCommented;
        const statusesCounts = Object.entries(setting.statusCounts).map(([status, count]) => ({ status, count }));

        return {
            totalEntries,
            totalRedo,
            timeSpentHours,
            timeSpentDays,
            totalRated,
            avgRated,
            totalFavorites,
            totalComments,
            statusesCounts
        };
    }

    async getHallOfFameData(data: Record<string, any>, currentUserId: number) {
        const {
            mediaTypes,
            currentUserRankData,
            mediaTypeCountMap,
            currentUserActiveSettings,
            rankedUsers,
            userSettingsMap,
            rankSelectionColName,
            page, pages, total,
        } = await this.repository.getHallOfFameData(data, currentUserId);

        // Calculate Current User's Percentile Ranks
        const userRanks = [];
        for (const mediaType of mediaTypes) {
            const rankKey = `${mediaType}Rank` as keyof typeof currentUserRankData;
            const rank = (currentUserRankData[rankKey] as number) ?? null;
            const mtCount = mediaTypeCountMap.get(mediaType) ?? 0;
            const active = currentUserActiveSettings.has(mediaType);
            let percent: number | null = null;

            if (rank !== null && active) {
                if (mtCount === 0) {
                    percent = null;
                }
                else if (mtCount === 1 && rank === 1) {
                    percent = 100;
                }
                else if (rank > mtCount) {
                    percent = null;
                }
                else {
                    percent = (rank / mtCount) * 100;
                }
            }

            userRanks.push({ rank, active, mediaType, percent });
        }

        // Format Final Results
        const items = rankedUsers.map((row) => {
            return {
                id: row.id,
                name: row.name,
                image: row.image,
                totalTime: row.totalTime,
                settings: userSettingsMap.get(row.id) ?? [],
                rank: (row[rankSelectionColName as keyof typeof row] as number) ?? null,
            }
        });

        return { items, page, pages, total, userRanks }
    }
}
