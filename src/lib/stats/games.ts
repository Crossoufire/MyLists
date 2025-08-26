import type {StatSection} from "@/lib/stats/types";
import {MediaType} from "@/lib/server/utils/enums";
import {SpecificMediaData} from "@/lib/stats/index";
import {formatNumberWithKM} from "@/lib/utils/functions";
import {MAIN_CARDS_CONFIG, MAIN_GRAPHS_CONFIG, SIDE_CARD_CONFIG, SIDE_LISTS_CONFIG} from "@/lib/stats/constants";
import {createRatingStatCard, createStatCard, createStatList, getCardsData, getListsData} from "@/lib/stats/helpers";


type GamesStats = SpecificMediaData<typeof MediaType.GAMES>


export const gamesData = (data: GamesStats): StatSection[] => {
    const sp = data.specificMediaStats;
    const topMode = sp.gameModes.topValues[0];
    const topEngine = sp.enginesStats.topValues[0];
    const topPerspective = sp.perspectivesStats.topValues[0];

    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                cardStatsList: [
                    createStatCard("Total Entries", data.totalEntries, "--> G@m3rz!? <--"),
                    createStatCard("Time Spent (h)", formatNumberWithKM(data.timeSpentHours), `Played ${data.timeSpentDays} Days`),
                    createRatingStatCard(data.ratingSystem, data.avgRated, data.totalRated),
                    createStatCard("Avg. Playtime", sp.avgDuration, "Playtime In Hours"),
                    createStatCard("Avg. Updates / Month", data.avgUpdates, `Total: ${data.totalUpdates} Updates`),
                    createStatCard("Top Engine", topEngine.name, `With ${topEngine.value} games`, sp.enginesStats.topValues),
                    createStatCard("Top Perspective", topPerspective.name, `With ${topPerspective.value} Games`, sp.perspectivesStats.topValues),
                    createStatCard("Top Mode", topMode.name, `With ${topMode.value} Games`, sp.gameModes.topValues),
                    createStatCard("Total Favorites", data.totalFavorites, "The Best Ones"),
                    createStatCard("Total Labels", sp.totalLabels, "Order Maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Release Dates", sp.releaseDates),
                    createStatList("Playtime (h)", sp.durationDistrib),
                    createStatList("Rating", sp.ratings),
                    createStatList("Updates / Month", data.updatesDistribution),
                ],
            },
            statuses: data.statusesCounts,
        },
        {
            sidebarTitle: "Platforms Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.platformsStats, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.platformsStats, "Played"), },
        },
        {
            sidebarTitle: "Developers Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.developersStats, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.developersStats, "Played"), },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.publishersStats, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.publishersStats, "Played"), },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, cardStatsList: getCardsData(sp.genresStats, "Played"), },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(sp.genresStats, "Played"), },
        },
    ];
};
