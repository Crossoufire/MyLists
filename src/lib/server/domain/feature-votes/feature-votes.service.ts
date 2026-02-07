import {FormattedError} from "@/lib/utils/error-classes";
import {FeatureStatus, FeatureVoteType} from "@/lib/utils/enums";
import {FeatureVotesRepository} from "@/lib/server/domain/feature-votes/feature-votes.repository";


const SUPER_VOTE_LIMIT = 3;
const SUPER_VOTE_WEIGHT = 5;


export class FeatureVotesService {
    constructor(private repository: typeof FeatureVotesRepository) {
    }

    async getFeatureVotes(currentUserId: number) {
        const [features, voteAgg, userVotes, superVotesUsed] = await Promise.all([
            this.repository.listFeatureRequests(),
            this.repository.getVoteAggregates(),
            this.repository.getUserVotes(currentUserId),
            this.repository.countUserSuperVotes(currentUserId),
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
    }

    async createFeatureRequest(params: { title: string; description?: string | null }, userId: number) {
        const title = params.title.trim();
        const description = params.description?.trim() || "No description provided yet.";
        const existingFeature = await this.repository.findFeatureByTitleLower(title.toLowerCase());

        if (existingFeature) {
            throw new FormattedError("That feature already exists. Try voting for it instead.");
        }

        await this.repository.createFeatureRequest({
            title,
            description,
            createdBy: userId,
            status: FeatureStatus.UNDER_CONSIDERATION,
        });
    }

    async toggleFeatureVote(params: { featureId: number; voteType: FeatureVoteType }, userId: number) {
        const feature = await this.repository.findFeatureById(params.featureId);

        if (!feature) {
            throw new FormattedError("Feature not found.");
        }

        const existingVote = await this.repository.findUserVote(userId, params.featureId);
        const isLocked = feature.status === FeatureStatus.REJECTED || feature.status === FeatureStatus.COMPLETED;

        if (isLocked) {
            throw new FormattedError("Voting is closed for this feature.");
        }

        const canSpendSuperVote = (await this.repository.countUserSuperVotes(userId)) < SUPER_VOTE_LIMIT;

        if (params.voteType === FeatureVoteType.VOTE) {
            if (existingVote?.voteType === FeatureVoteType.VOTE) {
                await this.repository.deleteVoteById(existingVote.id);
                return;
            }

            if (existingVote) {
                await this.repository.updateVoteType(existingVote.id, FeatureVoteType.VOTE);
                return;
            }

            await this.repository.insertVote({
                userId,
                featureId: params.featureId,
                voteType: FeatureVoteType.VOTE,
            });
            return;
        }

        if (existingVote?.voteType === FeatureVoteType.SUPER) {
            await this.repository.deleteVoteById(existingVote.id);
            return;
        }

        if (!canSpendSuperVote) {
            throw new FormattedError("You have no super-votes available.");
        }

        if (existingVote) {
            await this.repository.updateVoteType(existingVote.id, FeatureVoteType.SUPER);
            return;
        }

        await this.repository.insertVote({
            featureId: params.featureId,
            userId,
            voteType: FeatureVoteType.SUPER,
        });
    }

    async updateFeatureStatus(params: { featureId: number; status: FeatureStatus; adminComment?: string | null }) {
        await this.repository.updateFeatureStatus(params.featureId, params.status, params.adminComment?.trim() || null);
    }

    async deleteFeatureRequest(featureId: number) {
        const feature = await this.repository.findFeatureById(featureId);
        if (!feature) throw new FormattedError("Feature not found.");

        await this.repository.deleteVotesForFeature(featureId);
        await this.repository.deleteFeatureRequest(featureId);
    }
}
