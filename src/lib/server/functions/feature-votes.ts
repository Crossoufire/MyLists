import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {postFeatureDeleteSchema, postFeatureRequestSchema, postFeatureStatusSchema, postFeatureVoteSchema} from "@/lib/schemas";
import {publicAuthMiddleware, requiredAuthAndAdminRoleMiddleware, requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getFeatureVotes = createServerFn({ method: "GET" })
    .middleware([publicAuthMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        return featureVotesService.getFeatureVotes(currentUser?.id);
    });


export const postCreateFeatureRequest = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware])
    .validator(postFeatureRequestSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        featureVotesService.createFeatureRequest(currentUser.id, data);
    });


export const postToggleFeatureVote = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware])
    .validator(postFeatureVoteSchema)
    .handler(async ({ data: { featureId }, context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        featureVotesService.toggleFeatureVote(featureId, currentUser.id);
    });


export const postAdminUpdateFeatureStatus = createServerFn({ method: "POST" })
    .middleware([requiredAuthAndAdminRoleMiddleware])
    .validator(postFeatureStatusSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        featureVotesService.updateFeatureStatus(data, currentUser.id);
    });


export const postAdminDeleteFeatureRequest = createServerFn({ method: "POST" })
    .middleware([requiredAuthAndAdminRoleMiddleware])
    .validator(postFeatureDeleteSchema)
    .handler(async ({ data }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        featureVotesService.deleteFeatureRequest(data.featureId);
    });
