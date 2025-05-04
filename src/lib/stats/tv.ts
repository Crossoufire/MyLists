import {formatNumberWithKM} from "@/lib/utils/functions";
import type {ApiData, StatSection} from "@/lib/stats/types";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


export const tvData = (apiData: ApiData): StatSection[] => {
    const data = apiData as any;

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", data.totalEntries, `With ${data.totalRedo} Seasons Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.totalHours), `Watched ${data.totalDays} days`),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard("Avg. Duration", data.avgDuration, "Duration in hours"),
                    createStatCard("Avg. Updates / Month", data.avgUpdates, `With ${data.totalUpdates} updates`),
                    createStatCard("Top Country", data.countries?.topValues?.[0]?.name, `With ${data.countries?.topValues?.[0]?.value} media`),
                    createStatCard("Total Episodes", data.totalEpisodes, "Cumulated Episodes"),
                    createStatCard("Total Favorites", data.totalFavorites, "The best ones"),
                    createStatCard("Total Labels", data.totalLabels, "Order maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("First Air Dates", data.releaseDates),
                    createStatList("Durations (hours)", data.durations),
                    createStatList("Rating", data.ratings),
                    createStatList("Updates / Month", data.updates),
                ],
            },
            status: data.statusCounts,
        },
        {
            sidebarTitle: "Networks Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.networks) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.networks) },
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
