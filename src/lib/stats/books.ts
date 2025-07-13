import {ApiData} from ".";
import type {StatSection} from "@/lib/stats/types";
import {formatNumberWithKM, formatNumberWithSpaces} from "@/lib/utils/functions";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


export const booksData = (apiData: ApiData): StatSection[] => {
    const data = apiData as any;
    const topLanguage = data.languages?.top_values?.[0];

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                cardStatsList: [
                    createStatCard("Total Entries", data.totalMedia?.unique, `And ${data.total_media?.redo} Re-read`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.total_hours), `Read ${data.total_days} days`),
                    createRatingStatCard(data.rating_system, data.avg_rating, data.total_rated),
                    createStatCard("Avg. Pages", data.avg_pages, "Big books or small books?"),
                    createStatCard("Avg. Updates / Month", data.avg_updates, `With ${data.total_updates} updates`),
                    createStatCard("Top Language", topLanguage?.name, `With ${topLanguage?.value} media`, topLanguage?.name == null ? null : data.languages?.top_values),
                    createStatCard("Total Pages", formatNumberWithSpaces(data.total_pages), "Cumulated pages"),
                    createStatCard("Total Favorites", data.total_favorites, "The best ones"),
                    createStatCard("Total Labels", data.total_labels, "Order maniac"),
                    createStatCard("Classic", data.misc_genres?.[1]?.value, "Much fancy"),
                    createStatCard("Young Adult", data.misc_genres?.[0]?.value, "Good to be young"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Published Dates", data.release_dates),
                    createStatList("Pages", data.pages),
                    createStatList("Rating", data.ratings),
                    createStatList("Updates / Month", data.updates),
                ],
            },
            statuses: data.status_counts,
        },
        {
            sidebarTitle: "Authors Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(data.authors, "Read"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.authors, "Read"), },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(data.publishers, "Read"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.publishers, "Read"), },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(data.genres, "Read"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(data.genres, "Read"), },
        },
    ];
};
