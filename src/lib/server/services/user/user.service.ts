import { UserRepository } from "@/lib/server/repositories/user/user.repository";


export class UserService {
    constructor(private userRepository: typeof UserRepository) { }

    async getUserByUsername(username: string) {
        return this.userRepository.findByUsername(username);
    }

    async incrementProfileView(userId: string) {
        return this.userRepository.incrementProfileView(userId);
    }

    async getUserFollows(userId: string, limit = 8) {
        return this.userRepository.getUserFollows({ userId, limit });
    }
}
