import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryFormZodError} from "@/lib/utils/try-not-found";
import {adminRoleMiddleware, authMiddleware} from "@/lib/server/middlewares/authentication";
import {postFeatureDeleteSchema, postFeatureRequestSchema, postFeatureStatusSchema, postFeatureVoteSchema} from "@/lib/types/zod.schema.types";


export const getFeatureVotes = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        return featureVotesService.getFeatureVotes(currentUser.id);
    });


export const postCreateFeatureRequest = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .inputValidator(tryFormZodError(postFeatureRequestSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.createFeatureRequest(data, currentUser.id);
    });


export const postToggleFeatureVote = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .inputValidator(tryFormZodError(postFeatureVoteSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.toggleFeatureVote(data, currentUser.id);
    });


export const postUpdateFeatureStatus = createServerFn({ method: "POST" })
    .middleware([adminRoleMiddleware])
    .inputValidator(tryFormZodError(postFeatureStatusSchema))
    .handler(async ({ data }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.updateFeatureStatus(data);
    });


export const postDeleteFeatureRequest = createServerFn({ method: "POST" })
    .middleware([adminRoleMiddleware])
    .inputValidator(tryFormZodError(postFeatureDeleteSchema))
    .handler(async ({ data }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.deleteFeatureRequest(data.featureId);
    });
