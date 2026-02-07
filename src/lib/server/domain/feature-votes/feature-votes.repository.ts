import {and, count, desc, eq, notInArray, sql} from "drizzle-orm";
import {getDbClient} from "@/lib/server/database/async-storage";
import {FeatureStatus, FeatureVoteType} from "@/lib/utils/enums";
import {featureRequests, featureVotes} from "@/lib/server/database/schema";


export class FeatureVotesRepository {
    static async listFeatureRequests() {
        return getDbClient()
            .select()
            .from(featureRequests)
            .orderBy(desc(featureRequests.createdAt));
    }

    static async getVoteAggregates() {
        return getDbClient()
            .select({
                featureId: featureVotes.featureId,
                normalVotes: sql<number>`SUM(CASE WHEN ${featureVotes.voteType} = ${FeatureVoteType.VOTE} THEN 1 ELSE 0 END)`,
                superVotes: sql<number>`SUM(CASE WHEN ${featureVotes.voteType} = ${FeatureVoteType.SUPER} THEN 1 ELSE 0 END)`,
            })
            .from(featureVotes)
            .groupBy(featureVotes.featureId);
    }

    static async getUserVotes(userId: number) {
        return getDbClient()
            .select({
                voteType: featureVotes.voteType,
                featureId: featureVotes.featureId,
            })
            .from(featureVotes)
            .where(eq(featureVotes.userId, userId));
    }

    static async findFeatureByTitleLower(titleLower: string) {
        return getDbClient()
            .select({ id: featureRequests.id })
            .from(featureRequests)
            .where(sql`lower(${featureRequests.title}) = ${titleLower}`)
            .get();
    }

    static async createFeatureRequest(values: typeof featureRequests.$inferInsert) {
        await getDbClient()
            .insert(featureRequests)
            .values(values);
    }

    static async findFeatureById(featureId: number) {
        return getDbClient()
            .select()
            .from(featureRequests)
            .where(eq(featureRequests.id, featureId))
            .get();
    }

    static async findUserVote(userId: number, featureId: number) {
        return getDbClient()
            .select()
            .from(featureVotes)
            .where(and(
                eq(featureVotes.userId, userId),
                eq(featureVotes.featureId, featureId),
            ))
            .get();
    }

    static async countUserSuperVotes(userId: number) {
        return getDbClient()
            .select({ count: count() })
            .from(featureVotes)
            .innerJoin(featureRequests, eq(featureVotes.featureId, featureRequests.id))
            .where(and(
                eq(featureVotes.userId, userId),
                eq(featureVotes.voteType, FeatureVoteType.SUPER),
                notInArray(featureRequests.status, [FeatureStatus.REJECTED, FeatureStatus.COMPLETED]),
            ))
            .get()?.count ?? 0;
    }

    static async deleteVoteById(voteId: number) {
        await getDbClient()
            .delete(featureVotes)
            .where(eq(featureVotes.id, voteId));
    }

    static async updateVoteType(voteId: number, voteType: FeatureVoteType) {
        await getDbClient()
            .update(featureVotes)
            .set({ voteType })
            .where(eq(featureVotes.id, voteId));
    }

    static async insertVote(values: typeof featureVotes.$inferInsert) {
        await getDbClient()
            .insert(featureVotes)
            .values(values);
    }

    static async updateFeatureStatus(featureId: number, status: FeatureStatus, adminComment?: string | null) {
        await getDbClient()
            .update(featureRequests)
            .set({
                status,
                adminComment,
            })
            .where(eq(featureRequests.id, featureId));
    }

    static async deleteVotesForFeature(featureId: number) {
        await getDbClient()
            .delete(featureVotes)
            .where(eq(featureVotes.featureId, featureId));
    }

    static async deleteFeatureRequest(featureId: number) {
        await getDbClient()
            .delete(featureRequests)
            .where(eq(featureRequests.id, featureId));
    }
}
