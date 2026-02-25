import {statusUtils} from "@/lib/utils/mapping";
import {DeltaStats} from "@/lib/types/stats.types";
import {MediaType, Status} from "@/lib/utils/enums";
import {UserMediaStats} from "@/lib/types/base.types";
import {userMediaStatsHistory} from "@/lib/server/database/schema";
import {SearchType, SectionActivity} from "@/lib/types/zod.schema.types";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {UserStatsRepository} from "@/lib/server/domain/user/user-stats.repository";
import {UserUpdatesRepository} from "@/lib/server/domain/user/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/achievements/achievements.repository";
import {GridItem, MediaData, MediaInfo, MediaResult, WrappedResult} from "@/lib/types/activity.types";


const INIT_ACTIVITY_LIMIT = 24;
type StatsHistory = typeof userMediaStatsHistory.$inferSelect;


const emptyResult: WrappedResult = {
    count: 0,
    redoCount: 0,
    timeGained: 0,
    specificTotal: 0,
    completedCount: 0,
    progressedCount: 0,
    redo: [],
    completed: [],
    progressed: [],
};


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

    async updateUserPreComputedStatsWithDelta(userId: number, mediaType: MediaType, mediaId: number, delta: DeltaStats) {
        await this.repository.updateUserPreComputedStatsWithDelta(userId, mediaType, mediaId, delta);
    }

    async updateAllUsersPreComputedStats(mediaType: MediaType, userStats: UserMediaStats[]) {
        await this.repository.updateAllUsersPreComputedStats(mediaType, userStats);
    }

    async userHallofFameData(userId: number, filters: SearchType) {
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
            let percent: number | null = null;
            const rankKey = `${mediaType}Rank` as keyof typeof currentUserRankData;

            const rank = (currentUserRankData[rankKey] as unknown as number) ?? null;
            const mtCount = mediaTypeCountMap.get(mediaType) ?? 0;
            const active = currentUserActiveSettings.has(mediaType);

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

    // --- User Profile Summary Stats --------------------------------------------

    async userPreComputedStatsSummary(userId: number) {
        return this._getComputedStatsSummary({ userId });
    }

    async userPerMediaSummaryStats(userId: number, limit = 10) {
        const excludedStatuses = statusUtils.getNoPlanTo();
        const activeSettings = await this.repository.userActiveMediaSettings(userId);

        const data = [];
        for (const setting of activeSettings) {
            let totalNoPlan = 0;
            Object.entries(setting.statusCounts).forEach(([status, count]) => {
                if (!excludedStatuses.includes(status as Status)) {
                    totalNoPlan += count;
                }
            });

            const mediaService = this.mediaServiceRegistry.getService(setting.mediaType);
            const favoritesMedia = await mediaService.getUserFavorites(userId, limit);

            const statusList = Object.entries(setting.statusCounts).map(([status, count]) =>
                ({ status: status as Status, count, percent: (count / setting.totalEntries) * 100 })
            );

            const summary = {
                statusList: statusList,
                totalNoPlan: totalNoPlan,
                mediaType: setting.mediaType,
                favoritesList: favoritesMedia,
                avgRated: setting.averageRating,
                timeSpent: setting.timeSpent / 60,
                noData: setting.totalEntries === 0,
                totalEntries: setting.totalEntries,
                entriesRated: setting.entriesRated,
                totalSpecific: setting.totalSpecific,
                timeSpentDays: setting.timeSpent / 1440,
                EntriesFavorites: setting.entriesFavorites,
                percentRated: (setting.entriesRated === 0) ? null : (setting.entriesRated / totalNoPlan) * 100,
            };

            data.push(summary);
        }

        return data;
    }

    // --- User Advanced Stats  --------------------------------------------------

    async userAdvancedSummaryStats(userId: number) {
        const userPreComputedStats = await this._getComputedStatsSummary({ userId });
        const platinumAchievements = await this.achievementsRepository.countPlatinumAchievements(userId);
        const mediaUpdatesPerMonth = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({ userId });

        const tagCountPromises = userPreComputedStats.mediaTypes.map((mediaType) => {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            return mediaService.computeTotalTags(userId);
        });
        const tagCounts = await Promise.all(tagCountPromises);
        const totalTags = tagCounts.reduce((sum, count) => sum + count, 0);

        return {
            ...userPreComputedStats,
            totalTags,
            platinumAchievements,
            updatesPerMonth: mediaUpdatesPerMonth,
        };
    }

    async userAdvancedMediaStats(userId: number, mediaType: MediaType) {
        const mediaService = this.mediaServiceRegistry.getService(mediaType);

        const preComputedMediaStats = await this.repository.getAggregatedMediaStats({ userId, mediaType });
        const specificMediaStats = await mediaService.calculateAdvancedMediaStats(preComputedMediaStats.avgRated, userId);
        const mediaUpdatesPerMonthStats = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({ mediaType, userId });

        return {
            ...preComputedMediaStats,
            ...mediaUpdatesPerMonthStats,
            specificMediaStats,
        };
    }

    // --- Platform Advanced Stats -----------------------------------------------

    async platformAdvancedStatsSummary() {
        const platformPreComputedStats = await this._getComputedStatsSummary({});
        const platinumAchievements = await this.achievementsRepository.countPlatinumAchievements();
        const mediaUpdatesPerMonth = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({});

        const tagCountPromises = platformPreComputedStats.mediaTypes.map((mediaType) => {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            return mediaService.computeTotalTags();
        });
        const tagCounts = await Promise.all(tagCountPromises);
        const totalTags = tagCounts.reduce((sum, count) => sum + count, 0);

        return {
            ...platformPreComputedStats,
            totalTags,
            platinumAchievements,
            updatesPerMonth: mediaUpdatesPerMonth,
        };
    }

    async platformMediaAdvancedStats(mediaType: MediaType) {
        const mediaService = this.mediaServiceRegistry.getService(mediaType);

        const platformPreComputedStats = await this.repository.getAggregatedMediaStats({ mediaType });
        const mediaUpdatesPerMonthStats = await this.userUpdatesRepository.mediaUpdatesStatsPerMonth({ mediaType });
        const specificMediaStats = await mediaService.calculateAdvancedMediaStats(platformPreComputedStats.avgRated);

        return {
            ...platformPreComputedStats,
            ...mediaUpdatesPerMonthStats,
            specificMediaStats,
        };
    }

    // --- Activity Stats ----------------------------------------------------------

    async getMonthlyActivity(userId: number, start: Date, end: Date) {
        const mediaTypes = Object.values(MediaType);

        const results = await Promise.all(
            mediaTypes.map((mt) => this.getMediaTypeActivity(userId, mt, start, end))
        );

        return Object.fromEntries(
            mediaTypes.map((type, i) => [type, results[i]])
        ) as Record<MediaType, WrappedResult>;
    }

    async getMediaTypeActivity(userId: number, mediaType: MediaType, start: Date, end: Date) {
        const logEntries = await this.repository.getEntriesInRange(userId, mediaType, start, end);
        if (logEntries.length === 0) return emptyResult;

        const baseline = await this.repository.getLastEntryBefore(userId, mediaType, logEntries[0].timestamp);

        const mediaResults = this._computeActivityDeltas(mediaType, logEntries, baseline);
        const mediaIds = Object.keys(mediaResults).map(Number);
        if (mediaIds.length === 0) return emptyResult;

        const mediaService = this.mediaServiceRegistry.getService(mediaType);
        const mediaDetails = await mediaService.getMediaDetailsByIds(mediaIds);
        const metadataMap = new Map(mediaDetails.map((m) => [m.id, m]));

        return this._aggActivityResults(mediaType, mediaResults, metadataMap);
    }

    async getSectionActivity(userId: number, params: SectionActivity) {
        const { year, month, section, offset = 0, mediaType, limit = INIT_ACTIVITY_LIMIT } = params;

        const start = new Date(Date.UTC(year, month - 1, 0, 23, 59, 59));
        const mediaTypes = mediaType ? [mediaType] : Object.values(MediaType);
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

        const allItems: GridItem[] = [];
        for (const mediaType of mediaTypes) {
            const activity = await this._getFullMediaTypeActivity(userId, mediaType, start, end);
            activity[section].forEach((data) => allItems.push({ data, mediaType }));
        }

        allItems.sort((a, b) => {
            const timeDiff = b.data.timeGained - a.data.timeGained;
            if (timeDiff !== 0) return timeDiff;
            return b.data.mediaId - a.data.mediaId;
        });

        const items = allItems.slice(offset, offset + limit);
        const hasMore = offset + limit < allItems.length;

        return {
            items,
            hasMore,
            total: allItems.length,
        };
    }

    async _getFullMediaTypeActivity(userId: number, mediaType: MediaType, start: Date, end: Date) {
        const logEntries = await this.repository.getEntriesInRange(userId, mediaType, start, end);
        if (logEntries.length === 0) return { completed: [], progressed: [], redo: [] };

        const baseline = await this.repository.getLastEntryBefore(userId, mediaType, logEntries[0].timestamp);

        const mediaResults = this._computeActivityDeltas(mediaType, logEntries, baseline);
        const mediaIds = Object.keys(mediaResults).map(Number);
        if (mediaIds.length === 0) return { completed: [], progressed: [], redo: [] };

        const mediaService = this.mediaServiceRegistry.getService(mediaType);
        const mediaDetails = (await mediaService.getMediaDetailsByIds(mediaIds));
        const metadataMap = new Map(mediaDetails.map((m) => [m.id, m]));

        const redo: MediaData[] = [];
        const completed: MediaData[] = [];
        const progressed: MediaData[] = [];

        for (const result of Object.values(mediaResults)) {
            const meta = metadataMap.get(result.mediaId);
            if (!meta || result.specificGained <= 0) continue;

            const itemTime = this._calculateActivityTime(mediaType, result.specificGained, meta.duration);
            const mediaData: MediaData = {
                mediaId: meta.id,
                timeGained: itemTime,
                mediaName: meta.name,
                mediaCover: meta.imageCover,
                specificGained: result.specificGained,
            };

            if (result.isCompleted) completed.push(mediaData);
            else if (result.isRedo) redo.push(mediaData);
            else progressed.push(mediaData);
        }

        return { completed, progressed, redo };
    }

    _calculateActivityTime(mediaType: MediaType, specificGained: number, duration?: number) {
        switch (mediaType) {
            case MediaType.SERIES:
            case MediaType.ANIME:
            case MediaType.MOVIES:
                return specificGained * (duration ?? 20);
            case MediaType.GAMES:
                return specificGained;
            case MediaType.BOOKS:
                return specificGained * 1.7;
            case MediaType.MANGA:
                return specificGained * 7;
            default:
                return specificGained;
        }
    }

    _computeActivityDeltas(mediaType: MediaType, logEntries: StatsHistory[], baseline?: StatsHistory) {
        const results: Record<number, MediaResult> = {};
        const ledger = baseline ? [baseline, ...logEntries] : logEntries;

        for (let i = 1; i < ledger.length; i += 1) {
            const curr = ledger[i];
            const prev = ledger[i - 1];
            const { mediaId } = curr;

            results[mediaId] ??= {
                mediaId,
                isRedo: false,
                specificGained: 0,
                isCompleted: false,
            };

            const res = results[mediaId];

            if (mediaType === MediaType.GAMES) {
                res.specificGained += curr.timeSpent - prev.timeSpent;
            }
            else {
                res.specificGained += curr.totalSpecific - prev.totalSpecific;
            }

            if (curr.statusCounts.Completed > prev.statusCounts.Completed) {
                res.isCompleted = true;
            }

            if (curr.totalRedo > prev.totalRedo) {
                res.isRedo = true;
            }
        }

        return results;
    }

    _aggActivityResults(mediaType: MediaType, mediaResults: Record<number, MediaResult>, metadataMap: Map<number, MediaInfo>) {
        let timeGained = 0;
        let specificTotal = 0;
        const redo: MediaData[] = [];
        const completed: MediaData[] = [];
        const progressed: MediaData[] = [];

        for (const result of Object.values(mediaResults)) {
            const meta = metadataMap.get(result.mediaId);
            if (!meta || result.specificGained <= 0) continue;

            const itemTime = this._calculateActivityTime(mediaType, result.specificGained, meta.duration);

            const mediaData: MediaData = {
                mediaId: meta.id,
                mediaName: meta.name,
                timeGained: itemTime,
                mediaCover: meta.imageCover,
                specificGained: result.specificGained,
            };

            if (result.isCompleted) completed.push(mediaData);
            else if (result.isRedo) redo.push(mediaData);
            else if (result.specificGained > 0) progressed.push(mediaData);

            timeGained += itemTime;
            specificTotal += result.specificGained;
        }

        const sorter = (a: MediaData, b: MediaData) => b.timeGained - a.timeGained;

        redo.sort(sorter);
        completed.sort(sorter);
        progressed.sort(sorter);

        return {
            timeGained,
            specificTotal,
            redoCount: redo.length,
            completedCount: completed.length,
            progressedCount: progressed.length,
            count: completed.length + progressed.length + redo.length,
            redo: redo.slice(0, INIT_ACTIVITY_LIMIT),
            completed: completed.slice(0, INIT_ACTIVITY_LIMIT),
            progressed: progressed.slice(0, INIT_ACTIVITY_LIMIT),
        };
    }

    // --- Helpers ---------------------------------------------------------------

    private async _getComputedStatsSummary({ userId }: { userId?: number }) {
        const {
            preComputedStats,
            statusCountsList,
            mediaTimeDistribution,
            totalUsers,
        } = await this.repository.getPreComputedStatsSummary({ userId });

        const {
            totalHours,
            totalEntries,
            totalFavorites,
            totalComments,
            totalRedo,
            totalRated,
            sumOfAllRatings,
            distinctMediaTypes,
        } = preComputedStats;

        const excludedStatuses = statusUtils.getNoPlanTo();
        const totalEntriesNoPlan = statusCountsList.reduce((sum, setting) => {
            let settingSum = 0;
            for (const [status, count] of Object.entries(setting.statusCounts)) {
                if (!excludedStatuses.includes(status as Status)) {
                    settingSum += count;
                }
            }
            return sum + settingSum;
        }, 0);

        const avgRated = (totalRated === 0) ? null : (sumOfAllRatings / totalRated);
        const percentRated = (totalEntriesNoPlan === 0) ? null : (totalRated / totalEntriesNoPlan) * 100;

        // The divisor for averages changes based on context
        const avgDivisor = userId ? distinctMediaTypes : totalUsers;
        const avgComments = (avgDivisor === 0) ? null : (totalComments / avgDivisor);
        const avgFavorites = (avgDivisor === 0) ? null : (totalFavorites / avgDivisor);

        return {
            avgRated,
            totalRedo,
            totalRated,
            avgComments,
            percentRated,
            avgFavorites,
            totalEntries,
            totalComments,
            totalFavorites,
            totalEntriesNoPlan,
            mediaTimeDistribution,
            totalHours: totalHours,
            totalDays: totalHours / 24,
            mediaTypes: mediaTimeDistribution.map((d) => d.name),
            ...(userId ? {} : { totalUsers }),
        };
    }
}
