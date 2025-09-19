import {StatSection} from "@/lib/types/stats.types";
import {MediaType} from "@/lib/server/utils/enums";
import {SpecificMediaData} from "@/lib/stats/index";
import {formatNumberWithKM, intToMoney} from "@/lib/utils/functions";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


type MoviesStats = SpecificMediaData<typeof MediaType.MOVIES>;


export const moviesData = (data: MoviesStats): StatSection[] => {
    const sp = data.specificMediaStats;
    const topLang = sp.langsStats.topValues[0];

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                cardStatsList: [
                    createStatCard("Total Entries", data.totalEntries, `And ${data.totalRedo} Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.timeSpentHours), `Watched ${data.timeSpentDays.toFixed(0)} days`),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard("Avg. Duration", sp.avgDuration?.toFixed(2), "Duration in minutes"),
                    createStatCard("Avg. Updates / Month", data.avgUpdates?.toFixed(2), `With ${data.totalUpdates} updates`),
                    createStatCard("Top Language", topLang.name, `With ${topLang.value} media`, sp.langsStats.topValues),
                    createStatCard("Total Budgets", intToMoney(sp.totalBudget), "Cumulated budget"),
                    createStatCard("Total Revenue", intToMoney(sp.totalRevenue), "Cumulated revenue"),
                    createStatCard("Total Favorites", data.totalFavorites, "The best ones"),
                    createStatCard("Total Labels", sp.totalLabels, "Order maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Release dates", sp.releaseDates),
                    createStatList("Durations", sp.durationDistrib),
                    createStatList("Rating", sp.ratings),
                    createStatList("Updates / Month", data.updatesDistribution),
                ],
            },
            statuses: data.statusesCounts,
        },
        {
            sidebarTitle: "Directors Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.directorsStats) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.directorsStats) },
        },
        {
            sidebarTitle: "Actors Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.actorsStats) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.actorsStats) },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.genresStats) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.genresStats) },
        },
    ];
};
