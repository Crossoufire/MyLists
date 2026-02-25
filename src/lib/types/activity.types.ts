import {MediaType} from "@/lib/utils/enums";


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
    releaseDate: string;
    inUserList?: boolean;
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


export interface WrappedResult {
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
