import {UserRepository} from "@/lib/server/repositories/user/user.repository";


export class UserService {
    constructor(private userRepository: typeof UserRepository) {
    }

    async isFollowing(userId: number, followedId: number) {
        if (userId === followedId) return false;
        return this.userRepository.isFollowing(userId, followedId);
    }

    async getUserByUsername(username: string) {
        return this.userRepository.findByUsername(username);
    }

    async incrementProfileView(userId: number) {
        return this.userRepository.incrementProfileView(userId);
    }

    async getUserFollows(userId: number, limit = 8) {
        return this.userRepository.getUserFollows({ userId, limit });
    }

    async searchUsers(query: string, page: number = 1) {
        return this.userRepository.searchUsers(query, page);
    }
}
