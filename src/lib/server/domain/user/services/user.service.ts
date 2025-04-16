import {MediaType} from "@/lib/server/utils/enums";
import {UserRepository} from "@/lib/server/domain/user/repositories/user.repository";


export class UserService {
    constructor(private userRepository: typeof UserRepository) {
    }

    async isFollowing(userId: number, followedId: number) {
        if (userId === followedId) return false;
        return this.userRepository.isFollowing(userId, followedId);
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
        return this.userRepository.getUserFollowers({ userId, limit });
    }

    async getUserFollows(userId: number, limit = 8) {
        return this.userRepository.getUserFollows({ userId, limit });
    }

    async searchUsers(query: string, page: number = 1) {
        return this.userRepository.searchUsers(query, page);
    }
}
