import {db} from "@/lib/server/database/db";
import {createServerFn} from "@tanstack/react-start";
import {and, count, desc, eq, sql} from "drizzle-orm";
import {FormattedError} from "@/lib/utils/error-classes";
import {tryFormZodError} from "@/lib/utils/try-not-found";
import {FeatureStatus, FeatureVoteType} from "@/lib/utils/enums";
import {featureRequests, featureVotes} from "@/lib/server/database/schema";
import {adminRoleMiddleware, authMiddleware} from "@/lib/server/middlewares/authentication";
import {postFeatureRequestSchema, postFeatureStatusSchema, postFeatureVoteSchema} from "@/lib/types/zod.schema.types";


const SUPER_VOTE_LIMIT = 3;
const SUPER_VOTE_WEIGHT = 5;


export const getFeatureVotes = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const [features, voteAgg, userVotes] = await Promise.all([
            db.select().from(featureRequests).orderBy(desc(featureRequests.createdAt)),
            db.select({
                featureId: featureVotes.featureId,
                normalVotes: sql<number>`SUM(CASE WHEN ${featureVotes.voteType} = ${FeatureVoteType.VOTE} THEN 1 ELSE 0 END)`,
                superVotes: sql<number>`SUM(CASE WHEN ${featureVotes.voteType} = ${FeatureVoteType.SUPER} THEN 1 ELSE 0 END)`,
            })
                .from(featureVotes)
                .groupBy(featureVotes.featureId),
            db.select({
                featureId: featureVotes.featureId,
                voteType: featureVotes.voteType,
            })
                .from(featureVotes)
                .where(eq(featureVotes.userId, currentUser.id)),
        ]);

        const votesByFeature = new Map<number, { normalVotes: number, superVotes: number }>();
        voteAgg.forEach((vote) => {
            votesByFeature.set(vote.featureId, {
                superVotes: Number(vote.superVotes ?? 0),
                normalVotes: Number(vote.normalVotes ?? 0),
            });
        });

        const userVoteMap = new Map<number, FeatureVoteType>();
        userVotes.forEach((vote) => userVoteMap.set(vote.featureId, vote.voteType));
        const superVotesUsed = userVotes.filter((vote) => vote.voteType === FeatureVoteType.SUPER).length;

        const items = features.map((feature) => {
            const votes = votesByFeature.get(feature.id) ?? { normalVotes: 0, superVotes: 0 };
            const totalVotes = votes.normalVotes + votes.superVotes * SUPER_VOTE_WEIGHT;

            return {
                totalVotes,
                id: feature.id,
                title: feature.title,
                status: feature.status,
                superVotes: votes.superVotes,
                createdAt: feature.createdAt,
                normalVotes: votes.normalVotes,
                description: feature.description,
                adminComment: feature.adminComment,
                userVote: userVoteMap.get(feature.id) ?? null,
            };
        });

        return {
            items,
            superVotesUsed,
            superVoteLimit: SUPER_VOTE_LIMIT,
            superVoteWeight: SUPER_VOTE_WEIGHT,
        };
    });


export const postCreateFeatureRequest = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .inputValidator(tryFormZodError(postFeatureRequestSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const existingFeature = db
            .select({ id: featureRequests.id })
            .from(featureRequests)
            .where(sql`lower(${featureRequests.title}) = ${data.title.trim().toLowerCase()}`)
            .get();

        if (existingFeature) {
            throw new FormattedError("That feature already exists. Try voting for it instead.");
        }

        await db
            .insert(featureRequests)
            .values({
                title: data.title.trim(),
                createdBy: currentUser.id,
                status: FeatureStatus.UNDER_CONSIDERATION,
                description: data.description?.trim() || "No description provided yet.",
            });
    });


export const postToggleFeatureVote = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .inputValidator(tryFormZodError(postFeatureVoteSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const feature = db
            .select()
            .from(featureRequests)
            .where(eq(featureRequests.id, data.featureId))
            .get();

        if (!feature) {
            throw new FormattedError("Feature not found.");
        }

        const existingVote = db.select()
            .from(featureVotes)
            .where(and(
                eq(featureVotes.userId, currentUser.id),
                eq(featureVotes.featureId, data.featureId),
            ))
            .get();

        const isLocked = feature.status === FeatureStatus.REJECTED || feature.status === FeatureStatus.COMPLETED;
        if (isLocked && !existingVote) {
            throw new FormattedError("Voting is closed for this feature.");
        }
        if (isLocked && existingVote && existingVote.voteType !== data.voteType) {
            throw new FormattedError("Voting is closed for this feature.");
        }

        const canSpendSuperVote = (db
            .select({ count: count() })
            .from(featureVotes)
            .where(and(
                eq(featureVotes.userId, currentUser.id),
                eq(featureVotes.voteType, FeatureVoteType.SUPER),
            ))
            .get()?.count ?? 0) < SUPER_VOTE_LIMIT;

        if (data.voteType === FeatureVoteType.VOTE) {
            if (existingVote?.voteType === FeatureVoteType.VOTE) {
                await db
                    .delete(featureVotes)
                    .where(eq(featureVotes.id, existingVote.id));
                return;
            }

            if (existingVote) {
                await db
                    .update(featureVotes)
                    .set({ voteType: FeatureVoteType.VOTE })
                    .where(eq(featureVotes.id, existingVote.id));
                return;
            }

            await db
                .insert(featureVotes)
                .values({
                    userId: currentUser.id,
                    featureId: data.featureId,
                    voteType: FeatureVoteType.VOTE,
                });
            return;
        }

        if (existingVote?.voteType === FeatureVoteType.SUPER) {
            await db
                .delete(featureVotes)
                .where(eq(featureVotes.id, existingVote.id));
            return;
        }

        if (!canSpendSuperVote) {
            throw new FormattedError("You have no super-votes available.");
        }

        if (existingVote) {
            await db.update(featureVotes)
                .set({ voteType: FeatureVoteType.SUPER })
                .where(eq(featureVotes.id, existingVote.id));
            return;
        }

        await db
            .insert(featureVotes)
            .values({
                featureId: data.featureId,
                userId: currentUser.id,
                voteType: FeatureVoteType.SUPER,
            });
    });


export const postUpdateFeatureStatus = createServerFn({ method: "POST" })
    .middleware([adminRoleMiddleware])
    .inputValidator(tryFormZodError(postFeatureStatusSchema))
    .handler(async ({ data }) => {
        await db.update(featureRequests)
            .set({
                status: data.status,
                adminComment: data.adminComment?.trim() || null,
            })
            .where(eq(featureRequests.id, data.featureId));

        if (data.status === FeatureStatus.REJECTED || data.status === FeatureStatus.COMPLETED) {
            await db
                .delete(featureVotes)
                .where(and(
                    eq(featureVotes.featureId, data.featureId),
                    eq(featureVotes.voteType, FeatureVoteType.SUPER),
                ));
        }
    });
