import {MediaType} from "@/lib/utils/enums";


export type ActivityKind = "all" | "completed" | "progressed" | "redo";


export type ActivitySearch = {
    year: string;
    month: string;
    page?: number;
    search?: string;
    hiddenOnly?: boolean;
    activityKind?: ActivityKind;
    activeTab?: MediaType | "all";
}


export type MediaInfo = {
    id: number;
    name: string;
    duration?: number;
    imageCover: string;
    releaseDate: string;
    inUserList?: boolean;
    customCover: string | null;
}


export interface ActivityEditor {
    id: number;
    isRedo: boolean;
    mediaId: number;
    hidden: boolean;
    mediaName: string;
    mediaCover: string;
    lastUpdate: string;
    timeGained: number;
    isCompleted: boolean;
    mediaType: MediaType;
    specificGained: number;
}


export type PaginatedActivityFilter = {
    page?: number;
    perPage?: number;
    timeBucket: string;
    mediaType?: MediaType;
    hiddenOnly?: boolean;
    activityKind?: ActivityKind;
    mediaIdsByType?: Partial<Record<MediaType, number[]>>;
}


export interface WrappedActivityResult {
    count: number;
    timeGained: number;
    specificTotal: number;
}
