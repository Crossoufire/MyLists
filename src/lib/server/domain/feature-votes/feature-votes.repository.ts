import {getDbClient} from "@/lib/server/database/async-storage";
import {FeatureStatus, FeatureVoteType} from "@/lib/utils/enums";
import {and, count, desc, eq, notInArray, sql} from "drizzle-orm";
import {featureRequests, featureVotes,} from "@/lib/server/database/schema";


export class FeatureVotesRepository {
    static async getFeatureVotesData(userId: number) {
        const tx = getDbClient();

        const [features, voteAgg, userVotes, superVotesUsed] =
            await Promise.all([
                tx
                    .select()
                    .from(featureRequests)
                    .orderBy(desc(featureRequests.createdAt)),
                tx
                    .select({
                        featureId: featureVotes.featureId,
                        normalVotes: sql<number>`SUM(CASE WHEN ${featureVotes.voteType} = ${FeatureVoteType.VOTE} THEN 1 ELSE 0 END)`,
                        superVotes: sql<number>`SUM(CASE WHEN ${featureVotes.voteType} = ${FeatureVoteType.SUPER} THEN 1 ELSE 0 END)`,
                    })
                    .from(featureVotes)
                    .groupBy(featureVotes.featureId),
                tx
                    .select({
                        voteType: featureVotes.voteType,
                        featureId: featureVotes.featureId,
                    })
                    .from(featureVotes)
                    .where(eq(featureVotes.userId, userId)),

                FeatureVotesRepository.countUserSuperVotes(userId),
            ]);

        return { features, voteAgg, userVotes, superVotesUsed };
    }

    static async findFeatureWithUserVote(featureId: number, userId: number) {
        const tx = getDbClient();

        const [feature, existingVote] = await Promise.all([
            tx
                .select()
                .from(featureRequests)
                .where(eq(featureRequests.id, featureId))
                .get(),
            tx
                .select()
                .from(featureVotes)
                .where(and(eq(featureVotes.userId, userId), eq(featureVotes.featureId, featureId)))
                .get(),
        ]);

        return { feature, existingVote };
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
            )).get()?.count ?? 0;
    }

    static async createFeatureRequest(values: typeof featureRequests.$inferInsert) {
        const existing = getDbClient()
            .select({ id: featureRequests.id })
            .from(featureRequests)
            .where(sql`lower(${featureRequests.title}) = ${values.title!.toLowerCase()}`)
            .get();

        if (existing) {
            return { duplicate: true as const };
        }

        await getDbClient()
            .insert(featureRequests)
            .values(values);

        return { duplicate: false as const };
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
        await getDbClient().insert(featureVotes).values(values);
    }

    static async updateFeatureStatus(featureId: number, status: FeatureStatus, adminComment?: string | null) {
        await getDbClient()
            .update(featureRequests)
            .set({ status, adminComment })
            .where(eq(featureRequests.id, featureId));
    }

    static async deleteFeatureRequest(featureId: number) {
        await getDbClient()
            .delete(featureRequests)
            .where(eq(featureRequests.id, featureId));
    }
}
