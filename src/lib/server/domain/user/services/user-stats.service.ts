import {StatusUtils} from "@/lib/utils/functions";
import {DeltaStats} from "@/lib/server/types/stats.types";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {SearchTypeHoF, UserMediaStats} from "@/lib/server/types/base.types";
import {MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/user/repositories/achievements.repository";
import {SettingTable, UserStatsRepository} from "@/lib/server/domain/user/repositories/user-stats.repository";


export class UserStatsService {
    constructor(
        private repository: typeof UserStatsRepository,
        private achievementsRepository: typeof AchievementsRepository,
        private userUpdatesRepository: typeof UserUpdatesRepository,
        private mediaServiceRegistry: typeof MediaServiceRegistry,
    ) {
    }

    async updateUserMediaListSettings(userId: number, payload: Partial<Record<MediaType, boolean>>) {
        await this.repository.updateUserMediaListSettings(userId, payload);
    }

    async updateUserPreComputedStatsWithDelta(mediaType: MediaType, userId: number, delta: DeltaStats) {
        await this.repository.updateUserPreComputedStatsWithDelta(userId, mediaType, delta);
    }

    async userHallofFameData(userId: number, filters: SearchTypeHoF) {
        const {
            mediaTypes,
            currentUserRankData,
            mediaTypeCountMap,
            currentUserActiveSettings,
            rankedUsers,
            userSettingsMap,
            rankSelectionColName,
            page, pages, total,
        } = await this.repository.userHallofFameData(userId, filters);

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
        const activeSettings = await this.repository.userActiveMediaSettings(userId);
        // For single user, divisor for avgs is number of mediaType they use.
        return this._computePreComputedStatsSummary(activeSettings, activeSettings.length);
    }

    async userPerMediaSummaryStats(userId: number, _limit = 10) {
        const excludedStatuses = StatusUtils.getNoPlanTo();
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

    async updateAllUsersPreComputedStats(mediaType: MediaType, userStats: UserMediaStats[]) {
        await this.repository.updateAllUsersPreComputedStats(mediaType, userStats);
    }

    // --- User Advanced Stats  --------------------------------------------------

    async userAdvancedStatsSummary(userId: number) {
        const userPreComputedStats = await this.userPreComputedStatsSummary(userId);
        const platinumAchievements = await this.achievementsRepository.countPlatinumAchievements(userId);
        const mediaUpdatesPerMonth = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({ userId });

        // TODO: Commented because it needs all media types to be registered
        // const labelCountPromises = userPreComputedStats.mediaTypes.map((mediaType) => {
        //     const mediaService = this.mediaServiceRegistry.getService(mediaType);
        //     return mediaService.computeTotalMediaLabel(userId);
        // });
        // const labelCounts = await Promise.all(labelCountPromises);
        // const totalLabels = labelCounts.reduce((sum, count) => sum + count, 0);

        const totalLabels = 4;

        return {
            ...userPreComputedStats,
            totalLabels,
            platinumAchievements,
            updatesPerMonth: mediaUpdatesPerMonth,
        };
    }

    async userMediaAdvancedStats(userId: number, mediaType: MediaType) {
        const mediaService = this.mediaServiceRegistry.getService(mediaType);
        const specificMediaStats = await mediaService.calculateAdvancedMediaStats(userId);
        const userMediaPreComputedStats = await this.userMediaPreComputedStats(userId, mediaType);
        const mediaUpdatesPerMonthStats = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({ mediaType, userId });

        return { ...userMediaPreComputedStats, ...mediaUpdatesPerMonthStats, specificMediaStats };
    }

    async userMediaPreComputedStats(userId: number, mediaType: MediaType) {
        const mediaSettings = await this.repository.specificUserMediaSetting(userId, mediaType);
        return this._computeMediaPreComputedStats([mediaSettings!]);
    }

    // --- Platform Advanced Stats -----------------------------------------------

    async platformAdvancedStatsSummary() {
        const platformPreComputedStats = await this.platformPreComputedStatsSummary();
        const platinumAchievements = await this.achievementsRepository.countPlatinumAchievements();
        const mediaUpdatesPerMonth = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({});

        // TODO: Commented because it needs all media types to be registered
        // const labelCountPromises = platformPreComputedStats.mediaTypes.map((mediaType) => {
        //     const mediaService = this.mediaServiceRegistry.getService(mediaType);
        //     return mediaService.computeTotalMediaLabel();
        // });
        // const labelCounts = await Promise.all(labelCountPromises);
        // const totalLabels = labelCounts.reduce((sum, count) => sum + count, 0);

        const totalLabels = 4;

        return {
            ...platformPreComputedStats,
            totalLabels,
            platinumAchievements,
            updatesPerMonth: mediaUpdatesPerMonth,
        };
    }

    async platformMediaAdvancedStats(mediaType: MediaType) {
        const mediaService = this.mediaServiceRegistry.getService(mediaType);

        const specificMediaStats = await mediaService.calculateAdvancedMediaStats();
        const platformMediaPreComputedStats = await this.platformMediaPreComputedStats(mediaType);
        const mediaUpdatesPerMonthStats = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({ mediaType });

        return { ...platformMediaPreComputedStats, ...mediaUpdatesPerMonthStats, specificMediaStats };
    }

    async platformPreComputedStatsSummary() {
        const { preComputedStats, mediaTimeDistribution, totalUsers } = await this.repository.platformPreComputedStatsSummary();
        const avgComments = totalUsers === 0 ? 0 : (preComputedStats.totalComments / totalUsers);
        const avgFavorites = totalUsers === 0 ? 0 : (preComputedStats.totalFavorites / totalUsers);
        return { ...preComputedStats, mediaTimeDistribution, totalUsers, avgComments, avgFavorites };
    }

    async platformMediaPreComputedStats(mediaType: MediaType) {
        const mediaSettings = await this.repository.allUsersMediaSettings(mediaType);
        return this._computeMediaPreComputedStats(mediaSettings);
    }

    // --- Helpers ---------------------------------------------------------------

    private _computePreComputedStatsSummary(settings: SettingTable[], avgDivisor: number) {
        const totalHours = settings.reduce((sum, s) => sum + s.timeSpent / 60, 0);
        const totalEntries = settings.reduce((sum, s) => sum + s.totalEntries, 0);
        const totalFavorites = settings.reduce((sum, s) => sum + s.entriesFavorites, 0);
        const totalComments = settings.reduce((sum, s) => sum + s.entriesCommented, 0);
        const totalRedo = settings.reduce((sum, s) => sum + s.totalRedo, 0);
        const timePerMedia = settings.map((s) => s.timeSpent / 60);
        const mediaTimeDistribution = settings.map((s) => ({ name: s.mediaType, value: s.timeSpent / 60 }))

        const excludedStatuses = StatusUtils.getNoPlanTo();
        const totalEntriesNoPlan = settings.reduce((sum, setting) => {
            let settingSum = 0;
            for (const [status, count] of Object.entries(setting.statusCounts)) {
                if (!excludedStatuses.includes(status as Status)) {
                    settingSum += count;
                }
            }
            return sum + settingSum;
        }, 0);

        const totalRated = settings.reduce((sum, s) => sum + s.entriesRated, 0);
        const sumOfAllRatings = settings.reduce((sum, s) => sum + s.sumEntriesRated, 0);
        const percentRated = totalEntriesNoPlan === 0 ? 0 : (totalRated / totalEntriesNoPlan) * 100;
        const avgRated = totalRated === 0 ? 0 : (sumOfAllRatings / totalRated);

        // Handle specific avg. requirement
        const avgComments = avgDivisor === 0 ? 0 : (totalComments / avgDivisor);
        const avgFavorites = avgDivisor === 0 ? 0 : (totalFavorites / avgDivisor);

        return {
            timePerMedia,
            totalEntries,
            totalFavorites,
            totalComments,
            totalEntriesNoPlan,
            totalRated,
            percentRated,
            avgRated,
            avgComments,
            avgFavorites,
            totalRedo,
            mediaTimeDistribution,
            totalHours: Math.floor(totalHours),
            totalDays: Math.round(totalHours / 24),
            mediaTypes: [...new Set(settings.map((s) => s.mediaType))],
        };
    }

    private _computeMediaPreComputedStats(settings: SettingTable[]) {
        const totalEntries = settings.reduce((sum, s) => sum + s.totalEntries, 0);
        const totalRedo = settings.reduce((sum, s) => sum + s.totalRedo, 0);
        const timeSpentHours = settings.reduce((sum, s) => sum + s.timeSpent / 60, 0);
        const totalRated = settings.reduce((sum, s) => sum + s.entriesRated, 0);
        const sumOfAllRatings = settings.reduce((sum, s) => sum + s.sumEntriesRated, 0);
        const totalFavorites = settings.reduce((sum, s) => sum + s.entriesFavorites, 0);
        const totalComments = settings.reduce((sum, s) => sum + s.entriesCommented, 0);
        const totalSpecific = settings.reduce((sum, s) => sum + s.totalSpecific, 0);

        const avgRated = totalRated === 0 ? 0 : sumOfAllRatings / totalRated;

        const totalStatusCounts = settings.reduce((acc: Record<string, number>, setting) => {
            for (const [status, count] of Object.entries(setting.statusCounts)) {
                acc[status] = (acc[status] || 0) + count;
            }
            return acc;
        }, {});

        const statusesCounts = Object.entries(totalStatusCounts).map(([status, count]) => ({ status, count }),);

        return {
            totalEntries,
            totalRedo,
            timeSpentHours,
            totalSpecific,
            timeSpentDays: Math.round(timeSpentHours / 24),
            totalRated,
            avgRated,
            totalFavorites,
            totalComments,
            statusesCounts,
        };
    }
}
