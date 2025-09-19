import {StatSection} from "@/lib/types/stats.types";
import {MediaType} from "@/lib/server/utils/enums";
import {SpecificMediaData} from "@/lib/stats/index";
import {formatNumberWithKM} from "@/lib/utils/functions";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


type TvStats = SpecificMediaData<typeof MediaType.SERIES | typeof MediaType.ANIME>


export const tvData = (data: TvStats): StatSection[] => {
    const sp = data.specificMediaStats;
    const topLang = sp.countriesStats.topValues[0];
    const avgDurationHours = sp.avgDuration && (sp.avgDuration / 60).toFixed(2);
    
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                cardStatsList: [
                    createStatCard("Total Entries", data.totalEntries, `Total: ${data.totalRedo} Seasons Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.timeSpentHours), `Watched ${data.timeSpentDays.toFixed(0)} Days`),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard("Avg. Duration", avgDurationHours, "Duration In Hours"),
                    createStatCard("Avg. Updates / Month", data.avgUpdates?.toFixed(2), `Total: ${data.totalUpdates} Updates`),
                    createStatCard("Top Country", topLang.name, `Total: ${topLang.value} Media`),
                    createStatCard("Total Episodes", data.totalSpecific, "Cumulated Episodes"),
                    createStatCard("Total Favorites", data.totalFavorites, "The Best Ones"),
                    createStatCard("Total Labels", sp.totalLabels, "Order Maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("First Air Dates", sp.releaseDates),
                    createStatList("Durations (hours)", sp.durationDistrib),
                    createStatList("Rating", sp.ratings),
                    createStatList("Updates / Month", data.updatesDistribution),
                ],
            },
            statuses: data.statusesCounts,
        },
        {
            sidebarTitle: "Networks Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.networksStats) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.networksStats) },
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
