import {FormattedError} from "@/lib/utils/error-classes";
import {FeatureStatus, FeatureVoteType} from "@/lib/utils/enums";
import {FeatureVotesRepository} from "@/lib/server/domain/feature-votes/feature-votes.repository";


const SUPER_VOTE_LIMIT = 3;
const SUPER_VOTE_WEIGHT = 5;


export class FeatureVotesService {
    constructor(private repository: typeof FeatureVotesRepository) {
    }

    async getFeatureVotes(currentUserId: number) {
        const { features, voteAgg, userVotes, superVotesUsed } = await this.repository.getFeatureVotesData(currentUserId);

        const votesByFeature = new Map<number, { normalVotes: number; superVotes: number }>();
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

    async createFeatureRequest(userId: number, params: { title: string; description?: string | null }) {
        const { duplicate } = await this.repository.createFeatureRequest({
            createdBy: userId,
            title: params.title,
            status: FeatureStatus.UNDER_CONSIDERATION,
            description: params.description || "No description provided yet.",
        });

        if (duplicate) {
            throw new FormattedError("That feature already exists. Please vote for it instead.");
        }
    }

    async toggleFeatureVote(params: { featureId: number; voteType: FeatureVoteType }, userId: number) {
        const { feature, existingVote } = await this.repository.findFeatureWithUserVote(params.featureId, userId,);
        if (!feature) throw new FormattedError("Feature not found.");

        const isLocked = feature.status === FeatureStatus.REJECTED || feature.status === FeatureStatus.COMPLETED;
        if (isLocked) throw new FormattedError("Voting is closed for this feature.");

        if (params.voteType === FeatureVoteType.VOTE) {
            if (existingVote?.voteType === FeatureVoteType.VOTE) {
                return this.repository.deleteVoteById(existingVote.id);
            }

            if (existingVote) {
                return this.repository.updateVoteType(existingVote.id, FeatureVoteType.VOTE);
            }

            return this.repository.insertVote({ userId, featureId: params.featureId, voteType: FeatureVoteType.VOTE });
        }

        if (existingVote?.voteType === FeatureVoteType.SUPER) {
            return this.repository.deleteVoteById(existingVote.id);
        }

        const canSpendSuperVote = (await this.repository.countUserSuperVotes(userId)) < SUPER_VOTE_LIMIT;

        if (!canSpendSuperVote) {
            throw new FormattedError("You have no super-votes available.",);
        }

        if (existingVote) {
            await this.repository.updateVoteType(existingVote.id, FeatureVoteType.SUPER);
            return;
        }

        await this.repository.insertVote({ featureId: params.featureId, userId, voteType: FeatureVoteType.SUPER });
    }

    async updateFeatureStatus(params: { featureId: number; status: FeatureStatus; adminComment?: string | null }) {
        await this.repository.updateFeatureStatus(params.featureId, params.status, params.adminComment || null);
    }

    async deleteFeatureRequest(featureId: number) {
        await this.repository.deleteFeatureRequest(featureId);
    }
}
