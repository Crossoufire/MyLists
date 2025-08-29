import {JSX} from "react";
import {Status} from "@/lib/server/utils/enums";
import {NameValuePair} from "@/lib/types/base.types";


export type StatCardData = {
    title: string;
    subtitle: string;
    valuesList?: NameValuePair[];
    value: string | number | JSX.Element;
}


export type StatListData = {
    title: string;
    data: NameValuePair[];
}


export type StatSection = {
    sidebarTitle: string;
    cards: {
        cardsPerRow: number;
        cardsPerPage: number;
        isCarouselActive: boolean;
        cardStatsList: StatCardData[];
    };
    lists: {
        asGraph: boolean;
        listsPerRow: number;
        dataList: StatListData[];
    };
    statuses?: {
        count: number;
        status: string;
    }[];
}


export type DeltaStats = {
    views?: number;
    timeSpent?: number;
    totalRedo?: number;
    totalEntries?: number;
    entriesRated?: number;
    totalSpecific?: number;
    sumEntriesRated?: number;
    entriesCommented?: number;
    entriesFavorites?: number;
    statusCounts?: Partial<Record<Status, number>>;
};