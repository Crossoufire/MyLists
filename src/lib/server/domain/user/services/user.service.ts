import {MediaType} from "@/lib/utils/enums";
import {user} from "@/lib/server/database/schema";
import {FormattedError} from "@/lib/utils/error-classes";
import {AdminUpdatePayload, SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


export class UserService {
    constructor(private userRepository: typeof UserRepository) {
    }

    // --- Admin functions --------------------------------------------

    async getAdminPaginatedUsers(data: SearchTypeAdmin) {
        return this.userRepository.getAdminPaginatedUsers(data);
    }

    async adminUpdateUser(userId: number | undefined, payload: AdminUpdatePayload) {
        if (!userId && payload.showUpdateModal) {
            return this.userRepository.adminUpdateFeaturesFlag(payload.showUpdateModal);
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

        await this.userRepository.adminUpdateUser(userId, payload);
    }

    async getAdminOverview() {
        const userStats = await this.userRepository.getAdminUserStats();
        const recentUsers = await this.userRepository.getAdminRecentUsers(20);
        const usersPerPrivacy = await this.userRepository.getAdminUsersPerPrivacyValue();
        const cumulativeUsersPerMonth = await this.userRepository.getAdminCumulativeUsersPerMonth();

        return {
            ...userStats,
            recentUsers,
            usersPerPrivacy,
            cumulativeUsersPerMonth,
        };
    }

    async getAdminMediaOverview(mediaServiceRegistry: typeof MediaServiceRegistry) {
        const mediaStats = await Promise.all(Object.values(MediaType).map(async (mediaType) => {
            const mediaService = mediaServiceRegistry.getService(mediaType);
            const { added, updated } = await mediaService.getAdminUserMediaAddedAndUpdated();
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

    async getAdminArchivedTasks() {
        return this.userRepository.getAdminArchivedTasks();
    }

    // ----------------------------------------------------------------

    async deleteUserAccount(userId: number) {
        return this.userRepository.deleteUserAccount(userId);
    }

    async updateUserSettings(userId: number, payload: Partial<typeof user.$inferInsert>) {
        await this.userRepository.updateUserSettings(userId, payload);
    }

    async isFollowing(userId: number, followedId: number) {
        if (userId === followedId) return false;
        return this.userRepository.isFollowing(userId, followedId);
    }

    async updateNotificationsReadTime(userId: number) {
        return this.userRepository.updateNotificationsReadTime(userId);
    }

    async hasActiveMediaType(userId: number, mediaType: MediaType) {
        return this.userRepository.hasActiveMediaType(userId, mediaType);
    }

    async getUserByUsername(username: string) {
        return this.userRepository.findByUsername(username);
    }

    async getUserById(userId: number) {
        return this.userRepository.findById(userId);
    }

    async findUserByName(name: string) {
        const isUsernameTaken = await this.userRepository.findUserByName(name);
        if (isUsernameTaken) {
            throw new FormattedError("Invalid username. Please select another one.");
        }
    }

    async updateFeatureFlag(userId: number) {
        return this.userRepository.updateFeatureFlag(userId);
    }

    async updateFollowStatus(userId: number, followedId: number) {
        return this.userRepository.updateFollowStatus(userId, followedId);
    }

    async incrementProfileView(userId: number) {
        return this.userRepository.incrementProfileView(userId);
    }

    async incrementMediaTypeView(userId: number, mediaType: MediaType) {
        return this.userRepository.incrementMediaTypeView(userId, mediaType);
    }

    async getUserFollowers(userId: number, limit = 8) {
        return this.userRepository.getUserFollowers(userId, limit);
    }

    async getUserFollows(userId: number, limit = 8) {
        return this.userRepository.getUserFollows(userId, limit);
    }

    async searchUsers(query: string, page: number = 1) {
        return this.userRepository.searchUsers(query, page);
    }
}
