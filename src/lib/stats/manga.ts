import type {ApiData, StatSection} from "@/lib/stats/types";
import {formatNumberWithKM, formatNumberWithSpaces} from "@/lib/utils/functions";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


export const mangaData = (apiData: ApiData): StatSection[] => {
    const data = apiData as any;

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", data.total_media?.unique, `And ${data.total_media?.redo} Re-read`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.total_hours), `Read ${data.total_days} days`),
                    createRatingStatCard(data.rating_system, data.avg_rating, data.total_rated),
                    createStatCard("Avg. Chapters", data.avg_chapters, "Big manga or small manga?"),
                    createStatCard("Avg. Updates / Month", data.avg_updates, `With ${data.total_updates} updates`),
                    createStatCard("Total Chapters", formatNumberWithSpaces(data.total_chapters), "Cumulated chapters"),
                    createStatCard("Total Favorites", data.total_favorites, "The best ones"),
                    createStatCard("Total Labels", data.total_labels, "Order maniac"),
                    createStatCard("Ecchi", data.misc_genres?.[1]?.value, ";)"),
                    createStatCard("Shounen", data.misc_genres?.[0]?.value, "Friendship Powaaaa!"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Published Dates", data.release_dates),
                    createStatList("Chapters", data.chapters),
                    createStatList("Rating", data.ratings),
                    createStatList("Updates / Month", data.updates),
                ],
            },
            status: data.status_counts,
        },
        {
            sidebarTitle: "Authors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.authors, "Read"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.authors, "Read"), },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.publishers, "Read"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.publishers, "Read"), },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(data.genres, "Read"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.genres, "Read"), },
        },
    ];
};
