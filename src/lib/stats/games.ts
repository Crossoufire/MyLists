import {formatNumberWithKM} from "@/lib/utils/functions";
import type {ApiData, StatSection} from "@/lib/stats/types";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


export const gamesData = (apiData: ApiData): StatSection[] => {
    const data = apiData as any;

    const topMode = data.modes?.top_values?.[0];
    const topEngine = data.engines?.top_values?.[0];
    const topPerspective = data.perspectives?.top_values?.[0];

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", data.total_media?.total, "--> g@m3rz!? <--"),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.total_hours), `Played ${data.total_days} days`),
                    createRatingStatCard(data.rating_system, data.avg_rating, data.total_rated),
                    createStatCard("Avg. Playtime", data.avg_playtime, "Playtime in hours"),
                    createStatCard("Avg. Updates / Month", data.avg_updates, `With ${data.total_updates} updates`),
                    createStatCard("Top Engine", topEngine?.name, `With ${topEngine?.value} games`, topEngine?.name == null ? null : data.engines?.top_values),
                    createStatCard("Top Perspective", topPerspective?.name, `With ${topPerspective?.value} games`, topPerspective?.name == null ? null : data.perspectives?.top_values),
                    createStatCard("Top Mode", topMode?.name, `With ${topMode?.value} games`, topMode?.name == null ? null : data.modes?.top_values),
                    createStatCard("Total Favorites", data.total_favorites, "The best ones"),
                    createStatCard("Total Labels", data.total_labels, "Order maniac"),
                    createStatCard("Card Games", data.misc_genres?.[0]?.value, "Patrick Bruel"),
                    createStatCard("Stealth Games", data.misc_genres?.[1]?.value, "Sneaky sneaky"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Release Dates", data.release_dates),
                    createStatList("Playtime (h)", data.playtime),
                    createStatList("Rating", data.ratings),
                    createStatList("Updates / Month", data.updates),
                ],
            },
            status: data.status_counts,
        },
        {
            sidebarTitle: "Platforms Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.platforms, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.platforms, "Played"), },
        },
        {
            sidebarTitle: "Developers Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.developers, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.developers, "Played"), },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.publishers, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.publishers, "Played"), },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.genres, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.genres, "Played"), },
        },
    ];
};
