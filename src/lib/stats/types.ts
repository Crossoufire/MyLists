import {MediaType} from "@/lib/server/utils/enums";
import {userStatsOptions} from "@/lib/react-query/query-options/query-options";


export type ApiData = Awaited<ReturnType<NonNullable<ReturnType<typeof userStatsOptions>["queryFn"]>>>;


export interface DataToLoadProps {
    apiData: ApiData;
    forUser?: boolean;
    mediaType: MediaType;
}


export interface GlobalDataProps {
    apiData: ApiData;
    forUser?: boolean;
}


export interface StatCardData {
    data?: any;
    value: any;
    title: string;
    subtitle: string;
}


export interface StatListData {
    data: any;
    title: string;
}


export interface StatSection {
    sidebarTitle: string;
    cards: {
        cardsPerRow: number;
        cardsPerPage: number;
        dataList: StatCardData[];
        isCarouselActive: boolean;
    };
    lists: {
        asGraph: boolean;
        listsPerRow: number;
        dataList: StatListData[];
    };
    status?: any;
}
