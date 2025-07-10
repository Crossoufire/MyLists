import {MediaType} from "@/lib/server/utils/enums";
import {AdminPaginatedUsers, UserRepository} from "@/lib/server/domain/user/repositories/user.repository";
import {FormattedError} from "@/lib/server/utils/error-classes";


export class UserService {
    constructor(private userRepository: typeof UserRepository) {
    }

    async getAdminPaginatedUsers(data: AdminPaginatedUsers) {
        return this.userRepository.getAdminPaginatedUsers(data);
    }

    async adminUpdateUser(userId: number | undefined, payload: Record<string, any>) {
        if (!userId && payload.showUpdateModal) {
            await this.userRepository.adminUpdateFeaturesFlag(payload.showUpdateModal);
            return;
        }

        if (payload.delete && userId) {
            await this.userRepository.adminDeleteUser(userId);
            return;
        }

        const availablePayloads = ["privacy", "role", "emailVerified"];

        const isValidPayload = Object.keys(payload).every(key => availablePayloads.includes(key));
        if (!isValidPayload) {
            throw new FormattedError("Invalid payload");
        }

        await this.userRepository.adminUpdateUser(userId!, payload);
    }

    async updateUserSettings(userId: number, payload: Record<string, any>) {
        await this.userRepository.updateUserSettings(userId, payload);
    }

    async getAdminOverview() {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();

        const recentUsers = await this.userRepository.getAdminRecentUsers(10);
        const usersPerPrivacy = await this.userRepository.getAdminUsersPerPrivacyValue();
        const cumulativeUsersPerMonth = await this.userRepository.getAdminCumulativeUsersPerMonth(12);

        const userStats = await this.userRepository.getAdminUserStatistics({
            now: now.toISOString(),
            currentMonthStart,
            previousMonthStart,
            twoMonthsAgoStart,
            threeMonthsAgo,
        });

        return {
            totalUsers: userStats.totalUsers,
            activeUsers: userStats.activeUsers,
            newUsers: userStats.newUsers,
            cumulativeUsersPerMonth,
            recentUsers,
            usersPerPrivacy,
        };
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
        return this.userRepository.findUserByName(name);
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
