import {MediaType, PrivacyType} from "@/lib/utils/enums";


export type AssertCollection = {
    ownerId: number;
    privacy: PrivacyType;
    ownerPrivacy: PrivacyType;
};


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
    title: string;
    ownerId: number;
    ordered: boolean;
    mediaType: MediaType;
    privacy: PrivacyType;
    description?: string | null;
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
