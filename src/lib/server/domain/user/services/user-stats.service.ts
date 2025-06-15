import {DeltaStats} from "@/lib/server/types/stats.types";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";
import {UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";


export class UserStatsService {
    constructor(
        private repository: typeof UserStatsRepository,
        private achievementsRepository: typeof AchievementsRepository,
        private userUpdatesRepository: typeof UserUpdatesRepository,
        private mediaServiceRegistry: typeof MediaServiceRegistry,
    ) {
    }

    async updateUserMediaListSettings(userId: number, payload: Record<string, any>) {
        await this.repository.updateUserMediaListSettings(userId, payload);
    }

    async updateUserPreComputedStatsWithDelta(userId: number, mediaType: MediaType, delta: DeltaStats) {
        await this.repository.updateUserPreComputedStatsWithDelta(userId, mediaType, delta);
    }

    async userHallofFameData(userId: number, data: Record<string, any>) {
        const {
            mediaTypes,
            currentUserRankData,
            mediaTypeCountMap,
            currentUserActiveSettings,
            rankedUsers,
            userSettingsMap,
            rankSelectionColName,
            page, pages, total,
        } = await this.repository.userHallofFameData(userId, data);

        // Calculate Current User's Percentile Ranks
        const userRanks = [];
        for (const mediaType of mediaTypes) {
            const rankKey = `${mediaType}Rank` as keyof typeof currentUserRankData;
            const rank = (currentUserRankData[rankKey] as unknown as number) ?? null;
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

    async userPreComputedStatsSummary(userId: number) {
        // Return a user's stats summary for all its activated mediaTypes

        const activeSettings = await this.repository.userActiveMediaSettings(userId);

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

    async userPerMediaSummaryStats(userId: number, _limit = 10) {
        const excludedStatuses = Status.getNoPlanTo();
        const activeSettings = await this.repository.userActiveMediaSettings(userId);

        const data = [];
        for (const setting of activeSettings) {
            let totalNoPlan = 0;
            Object.entries(setting.statusCounts).forEach(([status, count]) => {
                if (!excludedStatuses.includes(status as Status)) {
                    totalNoPlan += count;
                }
            });

            // TODO: Can't be activated until all mediaTypes are registered
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

    async updateAllUsersPreComputedStats(mediaType: MediaType, userStats: any[]) {
        await this.repository.updateAllUsersPreComputedStats(mediaType, userStats);
    }

    // --- User Advanced Stats  --------------------------------------------------

    async userAdvancedStatsSummary(userId: number) {
        const userPreComputedStats = await this.userPreComputedStatsSummary(userId);
        const mediaUpdatesPerMonth = await this.userUpdatesRepository.allMediaUpdatesCountPerMonth(userId);
        const platinumAchievements = await this.achievementsRepository.countPlatinumAchievements(userId);

        // TODO: Commented because it needs all media types to be registered
        // const labelCountPromises = userPreComputedStats.mediaTypes.map((mediaType) => {
        //     const mediaService = this.mediaServiceRegistry.getService(mediaType);
        //     return mediaService.computeTotalMediaLabel(userId);
        // });
        // const labelCounts = await Promise.all(labelCountPromises);
        // const totalLabels = labelCounts.reduce((sum, count) => sum + count, 0);

        const totalLabels = 4;

        return { ...userPreComputedStats, totalLabels, platinumAchievements, updatesPerMonth: mediaUpdatesPerMonth };
    }

    async userMediaAdvancedStats(userId: number, mediaType: MediaType) {
        const mediaService = this.mediaServiceRegistry.getService(mediaType);

        const userMediaPreComputedStats = await this.userMediaPreComputedStats(mediaType, userId);
        const mediaUpdatesPerMonthStats = await this.userUpdatesRepository.mediaUpdatesCountPerMonth(mediaType, userId);
        const specificMediaStats = await mediaService.calculateAdvancedMediaStats(userId);

        return { ...userMediaPreComputedStats, ...mediaUpdatesPerMonthStats, ...specificMediaStats };
    }

    async userMediaPreComputedStats(mediaType: MediaType, userId: number) {
        const mediaSettings = await this.repository.specificUserMediaSetting(userId, mediaType);

        const totalEntries = mediaSettings.totalEntries;
        const totalRedo = mediaSettings.totalRedo;
        const timeSpentHours = mediaSettings.timeSpent / 60
        const timeSpentDays = Math.round(timeSpentHours / 24);
        const totalRated = mediaSettings.entriesRated;
        const avgRated = totalRated === 0 ? 0 : mediaSettings.sumEntriesRated / totalRated;
        const totalFavorites = mediaSettings.entriesFavorites;
        const totalComments = mediaSettings.entriesCommented;
        const statusesCounts = Object.entries(mediaSettings.statusCounts).map(([status, count]) => ({ status, count }));

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

    // --- Platform Advanced Stats -----------------------------------------------

    async platformAdvancedStatsSummary() {
        const platformPreComputedStats = await this.platformPreComputedStatsSummary();
        const platinumAchievements = await this.achievementsRepository.countPlatinumAchievements();
        const mediaUpdatesPerMonth = await this.userUpdatesRepository.allMediaUpdatesCountPerMonth();

        // TODO: Commented because it needs all media types to be registered
        // const labelCountPromises = platformPreComputedStats.mediaTypes.map((mediaType) => {
        //     const mediaService = this.mediaServiceRegistry.getService(mediaType);
        //     return mediaService.computeTotalMediaLabel();
        // });
        // const labelCounts = await Promise.all(labelCountPromises);
        // const totalLabels = labelCounts.reduce((sum, count) => sum + count, 0);

        const totalLabels = 4;

        return { ...platformPreComputedStats, totalLabels, platinumAchievements, updatesPerMonth: mediaUpdatesPerMonth };
    }

    async platformMediaAdvancedStats(mediaType: MediaType) {
        const mediaService = this.mediaServiceRegistry.getService(mediaType);

        const platformMediaPreComputedStats = await this.platformMediaPreComputedStats(mediaType);
        const mediaUpdatesPerMonthStats = await this.userUpdatesRepository.mediaUpdatesCountPerMonth(mediaType);
        const specificMediaStats = await mediaService.calculateAdvancedMediaStats();

        return { ...platformMediaPreComputedStats, ...mediaUpdatesPerMonthStats, ...specificMediaStats };
    }

    async platformMediaPreComputedStats(mediaType: MediaType) {
        const mediaSettings = await this.repository.allUsersMediaSettings(mediaType);

        const totalEntries = mediaSettings.reduce((sum, setting) => sum + setting.totalEntries, 0);
        const totalRedo = mediaSettings.reduce((sum, setting) => sum + setting.totalRedo, 0);
        const timeSpentHours = mediaSettings.reduce((sum, setting) => sum + setting.timeSpent / 60, 0);
        const timeSpentDays = Math.round(timeSpentHours / 24);
        const totalRated = mediaSettings.reduce((sum, setting) => sum + setting.entriesRated, 0);
        const avgRated = totalRated === 0 ? 0 : mediaSettings.reduce((sum, s) => sum + s.sumEntriesRated, 0) / totalRated;
        const totalFavorites = mediaSettings.reduce((sum, setting) => sum + setting.entriesFavorites, 0);
        const totalComments = mediaSettings.reduce((sum, setting) => sum + setting.entriesCommented, 0);

        const totalStatusCounts = mediaSettings.reduce((acc: Record<string, number>, setting) => {
            for (const [status, count] of Object.entries(setting.statusCounts)) {
                acc[status] = (acc[status] || 0) + count;
            }
            return acc;
        }, {});
        const statusesCounts = Object.entries(totalStatusCounts).map(([status, count]) => ({ status, count }));

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

    async platformPreComputedStatsSummary() {
        const allSettings = await this.repository.allUsersAllMediaSettings();

        const timePerMedia = allSettings.map((setting) => setting.timeSpent / 60);
        const totalHours = timePerMedia.reduce((sum, time) => sum + time, 0);
        const totalEntries = allSettings.reduce((sum, setting) => sum + setting.totalEntries, 0);
        const totalFavorites = allSettings.reduce((sum, setting) => sum + setting.entriesFavorites, 0);
        const totalComments = allSettings.reduce((sum, setting) => sum + setting.entriesCommented, 0);
        const totalRedo = allSettings.reduce((sum, setting) => sum + setting.totalRedo, 0);

        const excludedStatuses = Status.getNoPlanTo();
        const totalEntriesNoPlan = allSettings.reduce((sum, setting) => {
            let settingSum = 0;
            Object.entries(setting.statusCounts).forEach(([status, count]) => {
                if (!excludedStatuses.includes(status as Status)) {
                    settingSum += count;
                }
            });
            return sum + settingSum;
        }, 0);

        // Total and percentage rated
        const totalRated = allSettings.reduce((sum, setting) => sum + setting.entriesRated, 0);
        const percentRated = totalEntriesNoPlan === 0 ? 0 : (totalRated / totalEntriesNoPlan) * 100;
        const avgRated = totalRated === 0 ? 0 : allSettings.reduce((sum, s) => sum + s.sumEntriesRated, 0) / totalRated;
        const avgComments = totalComments === 0 ? 0 : totalComments / allSettings.length;
        const avgFavorites = totalFavorites === 0 ? 0 : totalFavorites / allSettings.length;

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
            mediaTypes: allSettings.map((setting) => setting.mediaType),
        };
    }
}
