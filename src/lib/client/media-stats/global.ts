import {ApiData} from "@/lib/client/media-stats/index";
import {StatSection} from "@/lib/types/stats.types";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG} from "@/lib/client/media-stats/constants";
import {createRatingStatCard, createStatCard, createStatList} from "@/lib/client/media-stats/helpers";


type GlobalStatsData = Extract<ApiData, { mediaType: undefined }>;


export const globalData = (data: GlobalStatsData, forUser = false): StatSection[] => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                cardStatsList: [
                    ...(forUser ? [] : [createStatCard("Total Active Users", data.totalUsers, "At least one media list")]),
                    createStatCard("Total Entries", data.totalEntries, "Cumulated Media Entries"),
                    createStatCard("Total Time Spent", `${(data.totalDays / 365).toFixed(1)}`, "Cumulated Time (years!)"),
                    createStatCard("Total Achievements", data.platinumAchievements, "Platinum Tiers!"),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard(`Avg. Favorites / ${forUser ? "Type" : "User"}`, data.avgFavorites?.toFixed(2), `Total: ${data.totalFavorites} Favorites`),
                    createStatCard(`Avg. Comments / ${forUser ? "Type" : "User"}`, data.avgComments?.toFixed(2), `Total: ${data.totalComments} Comments`),
                    createStatCard("Avg. Updates / Month", data.updatesPerMonth.avgUpdates?.toFixed(2), `Total: ${data.updatesPerMonth.totalUpdates} Updates`),
                    createStatCard("Total Labels Created", data.totalLabels, "With At Least One Media"),
                    createStatCard("Total Redo", data.totalRedo, "Re-watched And Re-read"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Time Spent (h) / Media Type", data.mediaTimeDistribution),
                    createStatList("Updates per Month", data.updatesPerMonth.updatesDistribution),
                ],
            },
        },
    ];
};
