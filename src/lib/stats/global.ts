import type {GlobalDataProps, StatSection} from "@/lib/stats/types";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList} from "@/lib/stats/helpers";


export const globalData = ({ apiData, forUser = false }: GlobalDataProps): StatSection[] => {
    const data = apiData as any;

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    ...(forUser ? [] : [createStatCard("Total Active Users", data.totalUsers, "At least one media list")]),
                    createStatCard("Total Entries", data.totalEntries, "Cumulated media entries"),
                    createStatCard("Total Time Spent", `${(data.totalDays / 365).toFixed(1)}`, "Cumulated time in years!"),
                    createStatCard("Total Achievements", data.platinumAchievements, "Platinum tiers!"),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard(`Avg. Favorites / ${forUser ? "Type" : "User"}`, data.avgFavorites, `With ${data.totalFavorites} favorites`),
                    createStatCard(`Avg. Comments / ${forUser ? "Type" : "User"}`, data.avgComments, `With ${data.totalComments} comments`),
                    createStatCard("Avg. Updates / Month", data.updatesPerMonth?.avgUpdates, `With ${data.updatesPerMonth?.totalUpdates} updates`),
                    createStatCard("Total Labels Created", data.totalLabels, "With at least one media"),
                    createStatCard("Total Redo", data.totalRedo, "Re-watched and re-read"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Updates per Month", data.updatesPerMonth),
                    createStatList("Time Spent (h) / Media Type", data.totalHours),
                ],
            },
        },
    ];
};
