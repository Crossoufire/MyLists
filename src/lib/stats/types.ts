import {JSX} from "react";
import {NameValuePair} from "@/lib/server/types/base.types";


export interface StatCardData {
    title: string;
    subtitle: string;
    valuesList?: NameValuePair[];
    value: string | number | JSX.Element;
}


export interface StatListData {
    title: string;
    data: NameValuePair[];
}


export interface StatSection {
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
