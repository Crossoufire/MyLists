import {formatNumberWithKM} from "@/lib/utils/functions";
import type {ApiData, StatSection} from "@/lib/stats/types";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


export const moviesData = (apiData: ApiData): StatSection[] => {
    const data = apiData as any;
    const topLanguage = data.languages?.topValues?.[0];

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", data.totalEntries, `And ${data.totalRedo} Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.totalHours), `Watched ${data.totalDays} days`),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard("Avg. Duration", data.avgDuration, "Duration in minutes"),
                    createStatCard("Avg. Updates / Month", data.avgUpdates, `With ${data.totalUpdates} updates`),
                    createStatCard("Top Language", topLanguage?.name, `With ${topLanguage?.value} media`, topLanguage?.name == null ? null : data.languages?.topValues),
                    createStatCard("Total Budgets", data.totalBudget, "Cumulated budget"),
                    createStatCard("Total Revenue", data.totalRevenue, "Cumulated revenue"),
                    createStatCard("Total Favorites", data.totalFavorites, "The best ones"),
                    createStatCard("Total Labels", data.totalLabels, "Order maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Release dates", data.releaseDates),
                    createStatList("Durations", data.durations),
                    createStatList("Rating", data.ratings),
                    createStatList("Updates / Month", data.updates),
                ],
            },
            status: data.statusCounts,
        },
        {
            sidebarTitle: "Directors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.directors) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.directors) },
        },
        {
            sidebarTitle: "Actors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.actors) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.actors) },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.genres) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.genres) },
        },
    ];
};
