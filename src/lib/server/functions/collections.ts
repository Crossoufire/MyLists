import {RoleType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {tryFormZodError, tryNotFound} from "@/lib/utils/try-not-found";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {optionalAuthMiddleware, privateAuthZMiddleware} from "@/lib/server/middlewares/authorization";
import {collectionIdSchema, communityCollectionsSchema, createCollectionSchema, updateCollectionSchema, userCollectionsSchema} from "@/lib/types/zod.schema.types";


export const getUserCollections = createServerFn({ method: "GET" })
    .middleware([privateAuthZMiddleware])
    .inputValidator(tryNotFound(userCollectionsSchema))
    .handler(async ({ data: { mediaType }, context: { user, currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        return collectionService.getUserCollections(user.id, currentUser?.id, mediaType);
    });


export const getCommunityCollections = createServerFn({ method: "GET" })
    .middleware([requiredAuthMiddleware])
    .inputValidator(tryNotFound(communityCollectionsSchema))
    .handler(async ({ data: { search, page, mediaType } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        return collectionService.getPublicCollections({ search, page, mediaType });
    });


export const getReadCollectionDetails = createServerFn({ method: "GET" })
    .middleware([optionalAuthMiddleware])
    .inputValidator(tryNotFound(collectionIdSchema))
    .handler(async ({ data: { collectionId }, context: { currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        return collectionService.getCollectionDetails(collectionId, "read", currentUser?.id, currentUser?.role as RoleType | null);
    });


export const getEditCollectionDetails = createServerFn({ method: "GET" })
    .middleware([optionalAuthMiddleware])
    .inputValidator(tryNotFound(collectionIdSchema))
    .handler(async ({ data: { collectionId }, context: { currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        return collectionService.getCollectionDetails(collectionId, "edit", currentUser?.id, currentUser?.role as RoleType | null);
    });


export const postCreateCollection = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(createCollectionSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        const collectionId = await collectionService.createCollection({ ...data, ownerId: currentUser.id });

        return { id: collectionId };
    });


export const postUpdateCollection = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(updateCollectionSchema))
    .handler(async ({ data, context: { currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        await collectionService.updateCollection({ ...data, actorId: currentUser.id, actorRole: currentUser.role as RoleType });
    });


export const postDeleteCollection = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(collectionIdSchema)
    .handler(async ({ data: { collectionId }, context: { currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        await collectionService.deleteCollection(collectionId, currentUser.id, currentUser.role as RoleType);
    });


export const postToggleCollectionLike = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(collectionIdSchema)
    .handler(async ({ data: { collectionId }, context: { currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        return collectionService.toggleLike(collectionId, currentUser.id);
    });


export const postCopyCollection = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(collectionIdSchema)
    .handler(async ({ data: { collectionId }, context: { currentUser } }) => {
        const container = await getContainer();
        const collectionService = container.services.collections;
        return collectionService.copyCollection(collectionId, currentUser.id);
    });
