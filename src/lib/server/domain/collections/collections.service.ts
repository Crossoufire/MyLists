import {notFound} from "@tanstack/react-router";
import {UserService} from "@/lib/server/domain/user";
import {MediaInfo} from "@/lib/types/activity.types";
import {FormattedError} from "@/lib/utils/error-classes";
import {AssertCollection, CommunitySearch} from "@/lib/types/collections.types";
import {MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";
import {CollectionsRepository} from "@/lib/server/domain/collections/collections.repository";
import {isAtLeastRole, MediaType, PrivacyType, RoleType, SocialState} from "@/lib/utils/enums";


type CollectionItemInput = {
    mediaId: number;
    annotation?: string | null;
};


export class CollectionsService {
    constructor(
        private userService: UserService,
        private repository: typeof CollectionsRepository,
        private mediaRegistry: typeof MediaServiceRegistry,
    ) {
    }

    async getCollectionDetails(collectionId: number, mode: "read" | "edit", viewerUserId?: number, viewerRole?: RoleType | null) {
        const collection = await this.repository.getCollectionById(collectionId);
        if (!collection) throw notFound();

        const isOwner = (viewerUserId === collection.ownerId);
        const isModerator = isAtLeastRole(viewerRole, RoleType.MANAGER);

        if (mode === "edit") {
            if (!isOwner && !isModerator) throw new FormattedError("Unauthorized");
        }
        else {
            await this._assertVisible(collection, isOwner, isModerator, viewerUserId);
        }

        const [items, isLiked] = await Promise.all([
            this.repository.getCollectionItems(collectionId),
            viewerUserId ? this.repository.findLikedCollection(viewerUserId, collectionId) : Promise.resolve(null),
            this.repository.incrementViewCount(collectionId),
        ]);

        const mediaService = this.mediaRegistry.getService(collection.mediaType);
        const mediaRows = await mediaService.getMediaForActivity(items.map((item) => item.mediaId)) as MediaInfo[];
        const mediaMap = new Map(mediaRows.map((m) => [m.id, m]));

        const detailedItems = items.map((item) => {
            const media = mediaMap.get(item.mediaId)!;
            return {
                mediaId: item.mediaId,
                mediaName: media.name,
                orderIndex: item.orderIndex,
                annotation: item.annotation,
                mediaCover: media.imageCover,
                releaseDate: media.releaseDate,
            };
        });

        return {
            collection,
            isLiked: !!isLiked,
            items: detailedItems,
            canManage: isOwner || isModerator,
        };
    }

    async getUserCollections(userId: number, mediaType?: MediaType, viewerUserId?: number) {
        const isOwner = (viewerUserId === userId);
        const allowedPrivacy = isOwner ? undefined : [PrivacyType.PUBLIC, PrivacyType.RESTRICTED];
        const collections = await this.repository.getUserCollections(userId, mediaType, allowedPrivacy);

        return this._enrichWithPreviews(collections);
    }

    async getPublicCollections(params: CommunitySearch) {
        const paginatedCollections = await this.repository.getPublicCollections(params);
        const results = await this._enrichWithPreviews(paginatedCollections.items);

        return {
            ...paginatedCollections,
            items: results,
        };
    }

    async createCollection(params: {
        title: string;
        ownerId: number;
        ordered: boolean;
        privacy: PrivacyType;
        mediaType: MediaType;
        description?: string | null;
        items: CollectionItemInput[];
    }) {
        const { items, ...collectionData } = params;
        const sanitizedItems = this._normalizeItems(items);

        const collectionId = await this.repository.createCollection({ ...collectionData });
        await this.repository.replaceCollectionItems(collectionId, sanitizedItems.map((item, index) => ({
            collectionId,
            mediaId: item.mediaId,
            orderIndex: index + 1,
            mediaType: params.mediaType,
            annotation: item.annotation ?? null,
        })));

        return collectionId;
    }

    async updateCollection(params: {
        title: string;
        actorId: number;
        ordered: boolean;
        privacy: PrivacyType;
        collectionId: number;
        description?: string | null;
        actorRole?: RoleType | null;
        items: CollectionItemInput[];
    }) {
        const collection = await this.repository.getCollectionById(params.collectionId);
        if (!collection) throw notFound();

        const isOwner = (collection.ownerId === params.actorId);
        const isModerator = isAtLeastRole(params.actorRole, RoleType.MANAGER);
        if (!isOwner && !isModerator) {
            throw new FormattedError("You cannot update this collection.");
        }

        const sanitizedItems = this._normalizeItems(params.items);
        await this.repository.updateCollection(params.collectionId, {
            title: params.title,
            privacy: params.privacy,
            ordered: params.ordered,
            description: params.description ?? null,
        });

        await this.repository.replaceCollectionItems(params.collectionId, sanitizedItems.map((item, index) => ({
            mediaId: item.mediaId,
            orderIndex: index + 1,
            mediaType: collection.mediaType,
            collectionId: params.collectionId,
            annotation: item.annotation ?? null,
        })));
    }

    async deleteCollection(params: { collectionId: number; actorId: number; actorRole?: RoleType | null }) {
        const collection = await this.repository.getCollectionById(params.collectionId);
        if (!collection) throw notFound();

        const isOwner = (collection.ownerId === params.actorId);
        const isModerator = isAtLeastRole(params.actorRole, RoleType.MANAGER);
        if (!isOwner && !isModerator) {
            throw new FormattedError("Unauthorized to delete this collection.");
        }

        await this.repository.deleteCollection(params.collectionId);
    }

    async toggleLike(viewerUserId: number, collectionId: number) {
        const collection = await this.repository.getCollectionById(collectionId);
        if (!collection) throw notFound();

        const isOwner = (collection.ownerId === viewerUserId);
        await this._assertVisible(collection, isOwner, false, viewerUserId);

        const existingLike = await this.repository.findLikedCollection(viewerUserId, collectionId);
        if (existingLike) {
            await this.repository.deleteLike(existingLike.id);
            await this.repository.decrementLikeCount(collectionId);
        }
        else {
            await this.repository.insertLike(viewerUserId, collectionId);
            await this.repository.incrementLikeCount(collectionId);
        }
    }

    async copyCollection(viewerUserId: number, collectionId: number) {
        const collection = await this.repository.getCollectionById(collectionId);
        if (!collection) throw notFound();

        const isOwner = (collection.ownerId === viewerUserId);
        await this._assertVisible(collection, isOwner, false, viewerUserId);

        const items = await this.repository.getCollectionItems(collectionId);
        const createdId = await this.repository.createCollection({
            ownerId: viewerUserId,
            ordered: collection.ordered,
            privacy: PrivacyType.PRIVATE,
            mediaType: collection.mediaType,
            description: collection.description,
            title: `Copy of ${collection.title}`,
        });

        if (items.length > 0) {
            await this.repository.replaceCollectionItems(createdId, items.map((item) => ({
                mediaId: item.mediaId,
                collectionId: createdId,
                annotation: item.annotation,
                orderIndex: item.orderIndex,
                mediaType: collection.mediaType,
            })));
        }

        await this.repository.incrementCopyCount(collectionId);

        return { id: createdId };
    }

    private _normalizeItems(items: CollectionItemInput[]) {
        const seen = new Set<number>();
        return items.filter((item) => {
            if (seen.has(item.mediaId)) return false;
            seen.add(item.mediaId);
            return true;
        });
    }

    private async _enrichWithPreviews(collections: Awaited<ReturnType<typeof CollectionsRepository.getUserCollections>>) {
        if (collections.length === 0) return [];

        const mediaMapByType = new Map<MediaType, Set<number>>();

        for (const collection of collections) {
            if (!mediaMapByType.has(collection.mediaType)) {
                mediaMapByType.set(collection.mediaType, new Set<number>());
            }
            const idSet = mediaMapByType.get(collection.mediaType)!;
            collection.previewItems.forEach((id: number) => idSet.add(id));
        }

        const mediaLookup = new Map<string, MediaInfo>();

        await Promise.all([...mediaMapByType.entries()].map(async ([mediaType, ids]) => {
            const mediaService = this.mediaRegistry.getService(mediaType);
            const mediaDetails = await mediaService.getMediaForActivity([...ids]) as MediaInfo[];
            mediaDetails.forEach((media) => mediaLookup.set(`${mediaType}-${media.id}`, media));
        }));

        return collections.map((collection) => ({
            ...collection,
            previews: collection.previewItems.map((id: number) => {
                const media = mediaLookup.get(`${collection.mediaType}-${id}`);
                if (!media) return null;

                return {
                    mediaId: media.id,
                    mediaName: media.name,
                    mediaCover: media.imageCover,
                    releaseDate: media.releaseDate,
                };
            }).filter((item): item is NonNullable<typeof item> => item !== null),
        }));
    }

    private async _assertVisible(collection: AssertCollection, isOwner: boolean, isModerator: boolean, viewerUserId?: number) {
        // Owners and moderators have instant access
        if (isOwner || isModerator) return;

        // Private collections are strictly for owners
        if (collection.privacy === PrivacyType.PRIVATE) {
            throw new FormattedError("Unauthorized");
        }

        // Handle non-authed user
        if (!viewerUserId) {
            if (collection.ownerPrivacy !== PrivacyType.PUBLIC) {
                throw new FormattedError("Unauthorized");
            }
            return;
        }

        // Handle Logged-in non-owner logic
        if (collection.privacy === PrivacyType.RESTRICTED && collection.ownerPrivacy === PrivacyType.PRIVATE) {
            const followStatus = await this.userService.getFollowingStatus(viewerUserId, collection.ownerId);
            if (followStatus?.status !== SocialState.ACCEPTED) {
                throw new FormattedError("Unauthorized");
            }
        }
    }
}
