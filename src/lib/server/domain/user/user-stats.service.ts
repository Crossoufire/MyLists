import {zeroPad} from "@/lib/utils/formating";
import {statusUtils} from "@/lib/utils/mapping";
import {DeltaStats} from "@/lib/types/stats.types";
import {MediaType, Status} from "@/lib/utils/enums";
import {UserMediaStats} from "@/lib/types/base.types";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {UserStatsRepository} from "@/lib/server/domain/user/user-stats.repository";
import {UserUpdatesRepository} from "@/lib/server/domain/user/user-updates.repository";
import {SearchType, SectionActivity, SpecificActivityFilters} from "@/lib/types/zod.schema.types";
import {AchievementsRepository} from "@/lib/server/domain/achievements/achievements.repository";
import {GridItem, MediaData, MediaInfo, MediaResult, UpdateActivity, WrappedActivityResult} from "@/lib/types/activity.types";


const INIT_ACTIVITY_LIMIT = 24;

const emptyResult: WrappedActivityResult = {
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

    async logActivityFromDelta(userId: number, mediaType: MediaType, mediaId: number, delta: DeltaStats) {
        const specificGained = this._resolveSpecificGainedFromDelta(mediaType, delta);
        if (!specificGained) return;

        const isRedo = (delta.totalRedo ?? 0) > 0;
        const isCompleted = (delta.statusCounts?.[Status.COMPLETED] ?? 0) > 0;

        await this.repository.logActivity([{ userId, mediaId, mediaType, specificGained, isCompleted, isRedo }]);
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

        const collectionCountPromises = userPreComputedStats.mediaTypes.map((mediaType) => {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            return mediaService.computeTotalCollections(userId);
        });
        const collectionCounts = await Promise.all(collectionCountPromises);
        const totalCollections = collectionCounts.reduce((sum, count) => sum + count, 0);

        return {
            ...userPreComputedStats,
            totalCollections,
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

        const collectionCountPromises = platformPreComputedStats.mediaTypes.map((mediaType) => {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            return mediaService.computeTotalCollections();
        });
        const collectionCounts = await Promise.all(collectionCountPromises);
        const totalCollections = collectionCounts.reduce((sum, count) => sum + count, 0);

        return {
            ...platformPreComputedStats,
            totalCollections,
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

    // --- Activity Stats ----------------------------------------------------------

    async getMonthlyActivity(userId: number, timeBucket: string) {
        const mediaTypes = Object.values(MediaType);

        const results = await Promise.all(
            mediaTypes.map((mt) => this.getMediaTypeActivity(userId, mt, timeBucket))
        );

        return Object.fromEntries(
            mediaTypes.map((type, i) => [type, results[i]])
        ) as Record<MediaType, WrappedActivityResult>;
    }

    async getMediaTypeActivity(userId: number, mediaType: MediaType, timeBucket: string) {
        const activities = await this.repository.getMediaTypeActivity(userId, mediaType, timeBucket);
        if (activities.length === 0) return emptyResult;

        const activitiesMapped = new Map(activities.map((a) => [a.mediaId, a]));
        if (activitiesMapped.size === 0) return emptyResult;

        const mediaService = this.mediaServiceRegistry.getService(mediaType);
        const mediaDetails = await mediaService.getMediaForActivity([...activitiesMapped.keys()]) as MediaInfo[];
        const mediaDetailsMap = new Map(mediaDetails.map((m) => [m.id, m]));

        return this._aggActivityResults(mediaType, activitiesMapped, mediaDetailsMap);
    }

    async getSectionActivity(userId: number, params: SectionActivity) {
        const { year, month, section, mediaType, offset = 0, limit = INIT_ACTIVITY_LIMIT } = params;

        const timeBucket = `${year}-${zeroPad(month)}`
        const mediaTypes = mediaType ? [mediaType] : Object.values(MediaType);

        const allItems: GridItem[] = [];
        for (const mediaType of mediaTypes) {
            const activity = await this._getFullMediaTypeActivity(userId, mediaType, timeBucket);
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

    async getSpecificActivity(userId: number, filters: Omit<SpecificActivityFilters, "username">) {
        const { year, month, mediaType, mediaId } = filters;

        const timeBucket = `${year}-${zeroPad(month)}`;
        return this.repository.getSpecificActivity(userId, mediaType, mediaId, timeBucket);
    }

    async updateSpecificActivity(userId: number, activityId: number, payload: UpdateActivity) {
        return this.repository.updateSpecificActivity(userId, activityId, payload);
    }

    async deleteSpecificActivity(userId: number, activityId: number) {
        await this.repository.deleteSpecificActivity(userId, activityId);
    }

    async deleteAssociatedActivities(userId: number, mediaType: MediaType, mediaId: number) {
        await this.repository.deleteAssociatedActivities(userId, mediaType, mediaId);
    }

    async _getFullMediaTypeActivity(userId: number, mediaType: MediaType, timeBucket: string) {
        const activities = await this.repository.getMediaTypeActivity(userId, mediaType, timeBucket);
        if (activities.length === 0) return { completed: [], progressed: [], redo: [] };

        const activitiesMapped = new Map(activities.map((a) => [a.mediaId, a]));
        if (activitiesMapped.size === 0) return { completed: [], progressed: [], redo: [] };

        const mediaService = this.mediaServiceRegistry.getService(mediaType);
        const mediaDetails = await mediaService.getMediaForActivity([...activitiesMapped.keys()]) as MediaInfo[];
        const mediaDetailsMap = new Map(mediaDetails.map((m) => [m.id, m]));

        return this._expandActivitySections(mediaType, activitiesMapped, mediaDetailsMap);
    }

    private _aggActivityResults(mediaType: MediaType, mediaResults: Map<number, MediaResult>, mediaDetailsMap: Map<number, MediaInfo>) {
        let timeGained = 0;
        let specificTotal = 0;
        const redo: MediaData[] = [];
        const completed: MediaData[] = [];
        const progressed: MediaData[] = [];

        for (const result of mediaResults.values()) {
            const meta = mediaDetailsMap.get(result.mediaId);
            if (!meta) continue;

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

    private _calculateActivityTime(mediaType: MediaType, specificGained: number, duration?: number) {
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

    private _expandActivitySections(mediaType: MediaType, aggregated: Map<number, MediaResult>, metadataMap: Map<number, MediaInfo>) {
        const redo: MediaData[] = [];
        const completed: MediaData[] = [];
        const progressed: MediaData[] = [];

        for (const result of aggregated.values()) {
            const meta = metadataMap.get(result.mediaId);
            if (!meta) continue;

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
            else if (result.specificGained > 0) progressed.push(mediaData);
        }

        return { completed, progressed, redo };
    }

    private _resolveSpecificGainedFromDelta(mediaType: MediaType, delta: DeltaStats) {
        if (mediaType === MediaType.GAMES) {
            return delta.timeSpent ?? 0;
        }
        return delta.totalSpecific ?? 0;
    }
}
