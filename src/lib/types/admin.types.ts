export type MediaRefreshRange = "30d" | "90d" | "1y" | "all";


export type MediaRefreshStatsParams = {
    recentPage?: number;
    topRange?: MediaRefreshRange;
    dailyRange?: MediaRefreshRange;
};
