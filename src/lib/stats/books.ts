import {SpecificMediaData} from "@/lib/stats/index";
import type {StatSection} from "@/lib/stats/types";
import {MediaType} from "@/lib/server/utils/enums";
import {formatNumberWithKM, formatNumberWithSpaces} from "@/lib/utils/functions";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


type BooksStats = SpecificMediaData<typeof MediaType.BOOKS>


export const booksData = (data: BooksStats): StatSection[] => {
    const sp = data.specificMediaStats;
    const topLang = sp.langsStats.topValues[0];

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                cardStatsList: [
                    createStatCard("Total Entries", data.totalEntries, `With ${data.totalRedo} Re-read`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.timeSpentHours), `Read ${data.timeSpentDays} days`),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard("Avg. Pages", sp.avgDuration, "Big books or small books?"),
                    createStatCard("Avg. Updates / Month", data.avgUpdates, `With ${data.totalUpdates} updates`),
                    createStatCard("Top Language", topLang.name, `With ${topLang.value} media`, sp.langsStats.topValues),
                    createStatCard("Total Pages", formatNumberWithSpaces(data.totalSpecific), "Cumulated pages"),
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
