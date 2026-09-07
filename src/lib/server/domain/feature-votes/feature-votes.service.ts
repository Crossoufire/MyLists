import {FormattedError} from "@/lib/utils/error-classes";
import {FeatureStatus, SocialNotifType} from "@/lib/utils/enums";
import {withTransaction} from "@/lib/server/database/async-storage";
import {NotificationsService} from "@/lib/server/domain/notifications/notifications.service";
import {FeatureVotesRepository} from "@/lib/server/domain/feature-votes/feature-votes.repository";


export class FeatureVotesService {
    constructor(
        private repository: typeof FeatureVotesRepository,
        private notificationsService: NotificationsService,
    ) {
    }

    async getFeatureVotes(userId?: number) {
        const { features, voteAgg, userVotes } = await this.repository.getFeatureVotesData(userId);

        const votesByFeature = new Map<number, number>();
        const userVoteIds = new Set(userVotes.map((vote) => vote.featureId));
        voteAgg.forEach((vote) => votesByFeature.set(vote.featureId, Number(vote.totalVotes ?? 0)));

        const items = features.map((feature) => {
            const totalVotes = votesByFeature.get(feature.id) ?? 0;

            return {
                totalVotes,
                id: feature.id,
                title: feature.title,
                status: feature.status,
                createdAt: feature.createdAt,
                description: feature.description,
                adminComment: feature.adminComment,
                hasUserVote: userVoteIds.has(feature.id),
                author: feature.author ? {
                    id: feature.author.id,
                    name: feature.author.name,
                    image: feature.author.image,
                } : null,
            };
        });

        return { items };
    }

    createFeatureRequest(userId: number, params: { title: string; description?: string | null }) {
        return withTransaction(() => {
            const { duplicate, featureId } = this.repository.createFeatureRequest({
                createdBy: userId,
                title: params.title,
                status: FeatureStatus.UNDER_CONSIDERATION,
                description: params.description || "No description provided.",
            });

            if (duplicate) {
                throw new FormattedError("That feature request already exists. Please vote for it instead.");
            }

            const admins = this.repository.getAdminUserIds();

            admins.filter((admin) => admin.id !== userId)
                .forEach((admin) => this.notificationsService.createSocialNotification({
                    actorId: userId,
                    userId: admin.id,
                    featureRequestId: featureId,
                    type: SocialNotifType.FEATURE_REQUEST_CREATED,
                }));
        });
    }

    toggleFeatureVote(featureId: number, userId: number) {
        return withTransaction(() => {
            const { feature, existingVote } = this.repository.findFeatureWithUserVote(featureId, userId);
            if (!feature) throw new FormattedError("Feature not found.");

            const isLocked = feature.status === FeatureStatus.REJECTED || feature.status === FeatureStatus.COMPLETED;
            if (isLocked) throw new FormattedError("Voting is closed for this feature.");

            if (existingVote) {
                return this.repository.deleteVoteById(existingVote.id);
            }

            this.repository.insertVote({ featureId, userId });
        });
    }

    updateFeatureStatus(params: { featureId: number; status: FeatureStatus; adminComment?: string | null }, adminUserId: number) {
        return withTransaction(() => {
            const feature = this.repository.getFeatureRequest(params.featureId);
            if (!feature) throw new FormattedError("Feature not found.");

            const nextAdminComment = params.adminComment || null;
            const statusChanged = feature.status !== params.status;
            const adminCommentChanged = (feature.adminComment ?? null) !== nextAdminComment && !!nextAdminComment;

            this.repository.updateFeatureStatus(params.featureId, params.status, nextAdminComment);

            if (feature.createdBy && feature.createdBy !== adminUserId && (statusChanged || adminCommentChanged)) {
                this.notificationsService.createSocialNotification({
                    actorId: adminUserId,
                    userId: feature.createdBy,
                    featureRequestId: params.featureId,
                    type: SocialNotifType.FEATURE_REQUEST_UPDATED,
                });
            }
        });
    }

    deleteFeatureRequest(featureId: number) {
        return withTransaction(() => {
            this.repository.deleteFeatureRequest(featureId);
        });
    }
}
