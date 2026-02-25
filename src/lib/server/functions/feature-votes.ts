import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryFormZodError} from "@/lib/utils/try-not-found";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {requiredAuthAndAdminRoleMiddleware, requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {postFeatureDeleteSchema, postFeatureRequestSchema, postFeatureStatusSchema, postFeatureVoteSchema} from "@/lib/types/zod.schema.types";


export const getFeatureVotes = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        return featureVotesService.getFeatureVotes(currentUser.id);
    });


export const postCreateFeatureRequest = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(postFeatureRequestSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.createFeatureRequest(currentUser.id, data);
    });


export const postToggleFeatureVote = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(postFeatureVoteSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.toggleFeatureVote(data, currentUser.id);
    });


export const postUpdateFeatureStatus = createServerFn({ method: "POST" })
    .middleware([requiredAuthAndAdminRoleMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(postFeatureStatusSchema))
    .handler(async ({ data }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.updateFeatureStatus(data);
    });


export const postDeleteFeatureRequest = createServerFn({ method: "POST" })
    .middleware([requiredAuthAndAdminRoleMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(postFeatureDeleteSchema))
    .handler(async ({ data }) => {
        const featureVotesService = await getContainer().then((c) => c.services.featureVotes);
        await featureVotesService.deleteFeatureRequest(data.featureId);
    });
