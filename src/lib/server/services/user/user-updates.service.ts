import { UserUpdatesRepository } from "@/lib/server/repositories/user/user-updates.repository";


export class UserUpdatesService {
    constructor(private userUpdatesRepository: typeof UserUpdatesRepository) { }

    async getUserUpdates(userId: string, limit = 8) {
        return this.userUpdatesRepository.getUserUpdates(userId, limit);
    }

    async getFollowsUpdates(userId: string, limit = 10) {
        return this.userUpdatesRepository.getFollowsUpdates(userId, limit);
    }
}