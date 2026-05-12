export type MediaRefreshRange = "30d" | "90d" | "1y" | "all";


export type AdminMediaRefreshStatsParams = {
    recentPage?: number;
    topRange?: MediaRefreshRange;
    dailyRange?: MediaRefreshRange;
};

export type AdminErrorLog = {
    name: string,
    message: string,
    stack: string | null,
}
