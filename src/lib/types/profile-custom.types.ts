import {MediaType} from "@/lib/utils/enums";


export type ProfileCustomKey = "highlightedMedia";
export type HighlightedMediaTab = "overview" | MediaType;
export type HighlightedMediaMode = "random" | "curated" | "disabled";


export interface HighlightedMediaRef {
    mediaId: number;
    mediaType: MediaType;
}


export interface HighlightedMediaResolvedItem extends HighlightedMediaRef {
    mediaName: string;
    mediaCover: string;
}


export interface BaseHighlightedMediaTabConfig<T> {
    items: T[];
    title: string;
    mode: HighlightedMediaMode;
}


export type HighlightedMediaTabConfig = BaseHighlightedMediaTabConfig<HighlightedMediaRef>;
export type ResolvedHighlightedMediaTabConfig = BaseHighlightedMediaTabConfig<HighlightedMediaResolvedItem>;
export type HighlightedMediaSettings = Record<HighlightedMediaTab, HighlightedMediaTabConfig>;
export type HighlightedMediaResolvedSettings = Record<HighlightedMediaTab, ResolvedHighlightedMediaTabConfig>;
