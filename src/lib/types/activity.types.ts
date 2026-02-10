import {MediaType} from "@/lib/utils/enums";


export type LogActivity = {
    userId: number;
    mediaId: number;
    isRedo: boolean;
    lastUpdate?: string;
    isCompleted: boolean;
    mediaType: MediaType;
    specificGained: number;
}


export type UpdateActivity = {
    isRedo?: boolean;
    lastUpdate?: string;
    isCompleted?: boolean;
    specificGained?: number;
}


export type SectionParams = {
    year: string;
    month: string;
    mediaType: MediaType | "all";
    section: "completed" | "progressed" | "redo";
}


export type MediaResult = {
    isRedo: boolean;
    mediaId: number;
    isCompleted: boolean;
    specificGained: number;
};


export type MediaInfo = {
    id: number;
    name: string;
    duration?: number;
    imageCover: string;
}


export interface MediaData {
    mediaId: number;
    mediaName: string;
    mediaCover: string;
    timeGained: number;
    specificGained: number;
}


export interface GridItem {
    data: MediaData;
    mediaType: MediaType;
}


export interface WrappedActivityResult {
    count: number;
    redoCount: number;
    timeGained: number;
    specificTotal: number;
    completedCount: number;
    progressedCount: number;
    redo: MediaData[];
    completed: MediaData[];
    progressed: MediaData[];
}
