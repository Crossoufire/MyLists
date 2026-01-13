import {MediaType} from "@/lib/utils/enums";
import {user} from "@/lib/server/database/schema";
import {FormattedError} from "@/lib/utils/error-classes";
import {CacheManager} from "@/lib/server/core/cache-manager";
import {UserRepository} from "@/lib/server/domain/user/user.repository";
import {AdminUpdatePayload, SearchTypeAdmin} from "@/lib/types/zod.schema.types";


const LAST_SEEN_CACHE_KEY = "lastSeen";
export const VISITS_CACHE_KEY = "visits";
const UPDATE_THRESHOLD_MS = 5 * 60 * 1000;


export class UserService {
    constructor(private repository: typeof UserRepository) {
    }

    // --- Admin functions --------------------------------------------

    async getUserOverviewForAdmin() {
        const userStats = await this.repository.getUserStatsForAdmin();
        const recentUsers = await this.repository.getActiveUsersForAdmin(20);
        const usersPerPrivacy = await this.repository.getUsersPerPrivacyValueForAdmin();
        const cumulativeUsersPerMonth = await this.repository.getCumUsersPerMonthForAdmin();

        return {
            ...userStats,
            recentUsers,
            usersPerPrivacy,
            cumulativeUsersPerMonth,
        };
    }

    async getPaginatedUsersForAdmin(data: SearchTypeAdmin) {
        return this.repository.getAdminPaginatedUsers(data);
    }

    async updateUserForAdmin(userId: number | undefined, payload: AdminUpdatePayload) {
        if (!userId && payload.showUpdateModal) {
            return this.repository.adminUpdateFeaturesFlag(payload.showUpdateModal);
        }

        if (!userId) return;

        if (payload.deleteUser) {
            return this.deleteUserAccount(userId);
        }

        const allowedKeys = new Set<keyof AdminUpdatePayload>(["emailVerified", "role", "privacy"]);
        const isValidPayload = Object.keys(payload).every((k) =>
            allowedKeys.has(k as keyof AdminUpdatePayload) || ["deleteUser", "showUpdateModal"].includes(k));

        if (!isValidPayload) {
            throw new FormattedError("Invalid payload");
        }

        await this.repository.adminUpdateUser(userId, payload);
    }

    // ----------------------------------------------------------------

    async updateUserLastSeen(cacheManager: CacheManager, userId: number) {
        const visitCounterKey = `${VISITS_CACHE_KEY}:${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
        await cacheManager.increment(visitCounterKey);

        const cacheKey = `${LAST_SEEN_CACHE_KEY}:${userId}`;
        if (await cacheManager.get(cacheKey)) return;
        await cacheManager.set(cacheKey, true, UPDATE_THRESHOLD_MS);

        return this.repository.updateUserLastSeen(userId);
    }

    async deleteUserAccount(userId: number) {
        return this.repository.deleteUserAccount(userId);
    }

    async updateUserSettings(userId: number, payload: Partial<typeof user.$inferInsert>) {
        await this.repository.updateUserSettings(userId, payload);
    }

    async isFollowing(userId: number, followedId: number) {
        if (userId === followedId) return false;
        return this.repository.isFollowing(userId, followedId);
    }

    async updateNotificationsReadTime(userId: number) {
        await this.repository.updateNotificationsReadTime(userId);
    }

    async updateShowOnboarding(userId: number) {
        await this.repository.updateShowOnboarding(userId);
    }

    async hasActiveMediaType(userId: number, mediaType: MediaType) {
        return this.repository.hasActiveMediaType(userId, mediaType);
    }

    async getUserByUsername(username: string) {
        return this.repository.findByUsername(username);
    }

    async getUserById(userId: number) {
        return this.repository.findById(userId);
    }

    async findUserByName(name: string) {
        const isUsernameTaken = await this.repository.findUserByName(name);
        if (isUsernameTaken) {
            throw new FormattedError("Invalid username. Please select another one.");
        }
    }

    async updateFeatureFlag(userId: number) {
        return this.repository.updateFeatureFlag(userId);
    }

    async updateFollowStatus(userId: number, followedId: number) {
        return this.repository.updateFollowStatus(userId, followedId);
    }

    async incrementProfileView(userId: number) {
        return this.repository.incrementProfileView(userId);
    }

    async incrementMediaTypeView(userId: number, mediaType: MediaType) {
        return this.repository.incrementMediaTypeView(userId, mediaType);
    }

    async getUserFollowers(currentUserId: number | undefined, userId: number, limit = 8) {
        return this.repository.getUserFollowers(currentUserId, userId, limit);
    }

    async getUserFollows(currentUserId: number | undefined, userId: number, limit = 8) {
        return this.repository.getUserFollows(currentUserId, userId, limit);
    }

    async getFollowCount(userId: number) {
        return this.repository.getFollowCount(userId);
    }

    async searchUsers(query: string, page: number = 1) {
        return this.repository.searchUsers(query, page);
    }
}
