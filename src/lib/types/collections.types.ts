import {MediaType, PrivacyType} from "@/lib/utils/enums";


export type DraftItem = {
    mediaId: number;
    mediaName: string;
    mediaCover: string;
    annotation?: string | null;
};


export type CommunitySearch = {
    page?: number;
    search?: string;
    mediaType?: MediaType;
};


export type CollectionOwner = {
    id: number;
    name: string;
    image?: string | null;
};


export type CollectionSummary = {
    id: number;
    ownerId: number;
    mediaType: MediaType;
    title: string;
    description?: string | null;
    privacy: PrivacyType;
    ordered: boolean;
    viewCount: number;
    likeCount: number;
    copiedCount: number;
    createdAt: string;
    itemsCount: number;
    ownerName: string;
    ownerImage?: string | null;
};


export type CollectionItemDetails = {
    mediaId: number;
    mediaName: string;
    orderIndex: number;
    mediaCover: string;
    annotation?: string | null;
    releaseDate?: string | null;
};


export type CollectionDetails = {
    collection: CollectionSummary;
    items: CollectionItemDetails[];
    isOwner: boolean;
    isLiked: boolean;
};
