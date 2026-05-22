import {zeroPad} from "@/lib/utils/formating";
import {statusUtils} from "@/lib/utils/mapping";
import {DeltaStats} from "@/lib/types/stats.types";
import {calculateActivityTime} from "@/lib/utils/activity-utils";
import {FormattedError} from "@/lib/utils/error-classes";
import {MediaType, Status} from "@/lib/utils/enums";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {UserStatsRepository} from "@/lib/server/domain/user/user-stats.repository";
import {UpdateUserMediaDetails, UserMediaStats} from "@/lib/types/user-media.types";
import {UserUpdatesRepository} from "@/lib/server/domain/user/user-updates.repository";
import {AchievementsRepository} from "@/lib/server/domain/achievements/achievements.repository";
import {ActivityEditor as ActivityEditorRow, MediaInfo, WrappedActivityResult} from "@/lib/types/activity.types";
import {AddActivity, MonthlyActivityFilters, MonthlyActivityStatsFilters, SearchType, SpecificActivityFilters, UpdateActivity} from "@/lib/schemas";


type ActivityMediaRef = {
    mediaId: number;
    mediaType: MediaType;
    specificGained: number;
};

type LogActivityFromDeltaParams = {
    userId: number;
    mediaId: number;
    delta: DeltaStats;
    lastUpdate?: string;
    mediaType: MediaType;
    newState: UpdateUserMediaDetails<any, any>["newState"];
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

    async userPerMediaSummaryStats(userId: number) {
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

            const statusList = Object.entries(setting.statusCounts)
                .map(([status, count]) =>
                    ({ status: status as Status, count, percent: (count / setting.totalEntries) * 100 })
                );

            const summary = {
                statusList: statusList,
                totalNoPlan: totalNoPlan,
                mediaType: setting.mediaType,
                avgRated: setting.averageRating,
                timeSpent: setting.timeSpent / 60,
                noData: setting.totalEntries === 0,
                totalEntries: setting.totalEntries,
                entriesRated: setting.entriesRated,
                totalSpecific: setting.totalSpecific,
                timeSpentDays: setting.timeSpent / 1440,
                entriesFavorites: setting.entriesFavorites,
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

    async logActivityFromDelta({ userId, mediaType, mediaId, delta, newState, lastUpdate }: LogActivityFromDeltaParams) {
        const activityFlags = lastUpdate
            ? {
                isCompleted: "status" in newState && newState.status === Status.COMPLETED,
                isRedo: ("redo" in newState && (newState.redo ?? 0) > 0) || !!("redo2" in newState && Array.isArray(newState.redo2)
                    && newState.redo2.some((count: number) => count > 0)),
            }
            : undefined;

        const isRedo = activityFlags?.isRedo ?? (delta.totalRedo ?? 0) > 0;
        const isCompleted = activityFlags?.isCompleted ?? (delta.statusCounts?.[Status.COMPLETED] ?? 0) > 0;
        const specificGained = (mediaType === MediaType.GAMES) ? (delta.timeSpent ?? 0) : (delta.totalSpecific ?? 0);

        await this.repository.logActivity({ userId, mediaId, mediaType, specificGained, isCompleted, isRedo, lastUpdate });
    }

    async getMonthlyActivityStats(userId: number, filters: MonthlyActivityStatsFilters) {
        const mediaTypes = Object.values(MediaType);
        const timeBucket = `${filters.year}-${zeroPad(filters.month)}`;

        const activities = await this.repository.getStatsActivities(userId, mediaTypes, timeBucket);
        const mediaDetailsByType = await this._getMediaDetailsByType(activities);

        const activityRecord = Object.fromEntries(
            mediaTypes.map((mediaType) =>
                [mediaType, { count: 0, timeGained: 0, specificTotal: 0 }])
        ) as Record<MediaType, WrappedActivityResult>;

        for (const entry of activities) {
            const mediaDetails = mediaDetailsByType.get(entry.mediaType)?.get(entry.mediaId);
            if (!mediaDetails) continue;

            const timeGained = calculateActivityTime(entry.mediaType, entry.specificGained, mediaDetails.duration);
            const aggStats = activityRecord[entry.mediaType];

            aggStats.count += 1;
            aggStats.timeGained += timeGained;
            aggStats.specificTotal += entry.specificGained;
        }

        const mediaStats = mediaTypes
            .map((mt) => ({
                mediaType: mt,
                timeGained: activityRecord[mt].timeGained,
                specificTotal: activityRecord[mt].specificTotal,
            }))
            .filter((stat) => stat.timeGained > 0 || stat.specificTotal > 0)
            .sort((a, b) => b.timeGained - a.timeGained);

        return {
            mediaStats,
            mediaTypes: mediaStats.map((stat) => stat.mediaType),
            totalTime: mediaStats.reduce((total, stat) => total + stat.timeGained, 0),
        };
    }

    async getMonthlyActivity(userId: number, filters: MonthlyActivityFilters) {
        const timeBucket = `${filters.year}-${zeroPad(filters.month)}`;
        const mediaTypes = filters.activeTab === "all" ? Object.values(MediaType) : [filters.activeTab];

        const mediaIdsByType = filters.search?.trim()
            ? await this._searchActivityMediaIds(userId, mediaTypes, filters.search.trim())
            : undefined;

        const [availableMediaTypes, result] = await Promise.all([
            this.repository.getActivityMediaTypes(userId, timeBucket, filters.hiddenOnly),
            this.repository.getPaginatedActivities(userId, {
                timeBucket,
                perPage: 48,
                mediaIdsByType,
                page: filters.page,
                hiddenOnly: filters.hiddenOnly,
                activityKind: filters.activityKind,
                mediaType: filters.activeTab === "all" ? undefined : filters.activeTab,
            }),
        ]);

        const mediaDetailsByType = await this._getMediaDetailsByType(result.items);

        const rows: ActivityEditorRow[] = [];
        for (const activity of result.items) {
            const mediaDetails = mediaDetailsByType.get(activity.mediaType)?.get(activity.mediaId);
            if (!mediaDetails) continue;

            rows.push({
                id: activity.id,
                hidden: activity.hidden,
                isRedo: activity.isRedo,
                mediaId: activity.mediaId,
                mediaName: mediaDetails.name,
                mediaType: activity.mediaType,
                lastUpdate: activity.lastUpdate,
                isCompleted: activity.isCompleted,
                mediaCover: mediaDetails.imageCover,
                specificGained: activity.specificGained,
                timeGained: calculateActivityTime(activity.mediaType, activity.specificGained, mediaDetails.duration),
            });
        }

        const items = rows.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());

        return { ...result, items, mediaTypes: availableMediaTypes };
    }

    async getSpecificActivity(userId: number, filters: SpecificActivityFilters) {
        const timeBucket = `${filters.year}-${zeroPad(filters.month)}`;
        return this.repository.getSpecificActivity(userId, filters.mediaType, filters.mediaId, timeBucket);
    }

    async updateSpecificActivity(userId: number, activityId: number, payload: UpdateActivity) {
        return this.repository.updateSpecificActivity(userId, activityId, payload);
    }

    async addManualActivity(userId: number, payload: AddActivity) {
        const mediaService = this.mediaServiceRegistry.getService(payload.mediaType);

        const media = await mediaService.findById(payload.mediaId);
        if (!media) throw new FormattedError("Media not found");

        const inUserList = await mediaService.hasUserMedia(userId, payload.mediaId);
        if (!inUserList) throw new FormattedError("Media not in your list");

        await this.repository.logActivity({
            ...payload,
            userId,
            isRedo: payload.isRedo ?? false,
            isCompleted: payload.isCompleted ?? false,
            hidden: payload.hidden ?? false,
        });
    }

    async searchActivityUserMedia(userId: number, mediaType: MediaType, query: string) {
        const mediaService = this.mediaServiceRegistry.getService(mediaType);
        return mediaService.searchUserListByName(userId, query.trim(), 20);
    }

    async deleteSpecificActivity(userId: number, activityId: number) {
        await this.repository.deleteSpecificActivity(userId, activityId);
    }

    async bulkHideActivity(userId: number, filters: { startDate: string, endDate: string, mediaType?: MediaType }) {
        const end = new Date(`${filters.endDate}T23:59:59.999Z`);
        const start = new Date(`${filters.startDate}T00:00:00.000Z`);

        return this.repository.bulkHideActivity(userId, {
            endDate: end.toISOString(),
            mediaType: filters.mediaType,
            startDate: start.toISOString(),
        });
    }

    async deleteAssociatedActivities(userId: number, mediaType: MediaType, mediaId: number) {
        await this.repository.deleteAssociatedActivities(userId, mediaType, mediaId);
    }

    private async _getMediaDetailsByType(activities: ActivityMediaRef[]) {
        const mediaTypes = [...new Set(activities.map((activity) => activity.mediaType))];
        const mediaDetailsByType = new Map<MediaType, Map<number, MediaInfo>>();

        await Promise.all(mediaTypes.map(async (mediaType) => {
            const mediaIds = activities
                .filter((activity) => activity.mediaType === mediaType)
                .map((activity) => activity.mediaId);

            if (mediaIds.length === 0) {
                mediaDetailsByType.set(mediaType, new Map());
                return;
            }

            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const mediaDetails = await mediaService.getMediaDetailsByIds(mediaIds);
            mediaDetailsByType.set(mediaType, new Map(mediaDetails.map((m) => [m.id, m])));
        }));

        return mediaDetailsByType;
    }

    private async _searchActivityMediaIds(userId: number, mediaTypes: MediaType[], search: string) {
        const entries = await Promise.all(mediaTypes.map(async (mediaType) => {
            const mediaService = this.mediaServiceRegistry.getService(mediaType);
            const results = await mediaService.searchUserListByName(userId, search, 20);

            return [mediaType, results.map((result) => result.mediaId)] as const;
        }));

        return Object.fromEntries(entries) as Partial<Record<MediaType, number[]>>;
    }

}
