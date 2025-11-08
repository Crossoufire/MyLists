import {MangaData} from "@/lib/client/media-stats/index";
import type {StatSection} from "@/lib/types/stats.types";
import {formatNumberWithKM, formatNumberWithSpaces} from "@/lib/utils/functions";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/client/media-stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/client/media-stats/helpers";


export const mangaData = (data: MangaData): StatSection[] => {
    const sp = data.specificMediaStats;

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                cardStatsList: [
                    createStatCard("Total Entries", data.totalEntries, `With ${data.totalRedo} Re-read`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.timeSpentHours), `Read ${data.timeSpentDays.toFixed(0)} days`),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard("Avg. Chapters", sp.avgDuration?.toFixed(2), "Big manga or small manga?"),
                    createStatCard("Avg. Updates / Month", data.avgUpdates?.toFixed(2), `With ${data.totalUpdates} updates`),
                    createStatCard("Total Chapters", formatNumberWithSpaces(data.totalSpecific), "Cumulated pages"),
                    createStatCard("Total Favorites", data.totalFavorites, "The best ones"),
                    createStatCard("Total Labels", sp.totalLabels, "Order maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Published Dates", sp.releaseDates),
                    createStatList("Pages", sp.durationDistrib),
                    createStatList("Rating", sp.ratings),
                    createStatList("Updates / Month", data.updatesDistribution),
                ],
            },
            statuses: data.statusesCounts,
        },
        {
            sidebarTitle: "Authors Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.authorsStats, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.authorsStats, "Read") },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.publishersStats, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.publishersStats, "Read") },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.genresStats, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.genresStats, "Read") },
        },
    ];
};
