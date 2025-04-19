import {userStatsOptions} from "@/lib/react-query/query-options";
import {MediaType, RatingSystemType} from "@/lib/server/utils/enums";
import {formatNumberWithKM, formatNumberWithSpaces, getFeelingIcon} from "@/lib/utils/functions";


// Constants for common configurations
const MAIN_CARDS_CONFIG = {
    cardsPerRow: 4,
    cardsPerPage: 8,
    isCarouselActive: true,
};


const MAIN_GRAPHS_CONFIG = {
    listsPerRow: 2,
    asGraph: true,
};


const SIDE_CARD_CONFIG = {
    cardsPerRow: 3,
    cardsPerPage: 3,
    isCarouselActive: false,
};


const SIDE_LISTS_CONFIG = {
    listsPerRow: 3,
    asGraph: false,
};


type ApiData = Awaited<ReturnType<NonNullable<ReturnType<typeof userStatsOptions>["queryFn"]>>>;


interface DataToLoadProps {
    apiData: ApiData;
    forUser?: boolean;
    mediaType: MediaType;
}


interface GlobalDataProps {
    forUser?: boolean;
    apiData: Awaited<ReturnType<NonNullable<ReturnType<typeof userStatsOptions>["queryFn"]>>>;
}


export const dataToLoad = ({ mediaType, apiData, forUser = false }: DataToLoadProps) => {
    if (!mediaType) {
        return globalData({ apiData, forUser });
    }

    const mediaData = {
        series: tvData,
        anime: tvData,
        movies: moviesData,
        books: booksData,
        games: gamesData,
        manga: mangaData,
    };
    return mediaData[mediaType](apiData);
};


const globalData = ({ apiData, forUser = false }: GlobalDataProps) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    ...(forUser ? [] : [createStatCard("Total Active Users", apiData.totalUsers, "At least one media list")]),
                    createStatCard("Total Entries", apiData.totalEntries, "Cumulated media entries"),
                    createStatCard("Total Time Spent", `${(apiData.totalDays / 365).toFixed(1)}`, "Cumulated time in years!"),
                    createStatCard("Total Achievements", apiData.platinumAchievements, "Platinum tiers!"),
                    createRatingStatCard(RatingSystemType.SCORE, apiData.avgRated, apiData.totalRated),
                    createStatCard(`Avg. Favorites / ${forUser ? "Type" : "User"}`, apiData.avgFavorites, `With ${apiData.totalFavorites} favorites`),
                    createStatCard(`Avg. Comments / ${forUser ? "Type" : "User"}`, apiData.avgComments, `With ${apiData.totalComments} comments`),
                    createStatCard("Avg. Updates / Month", apiData.updatesPerMonth.avgUpdates, `With ${apiData?.totalUpdates} updates`),
                    createStatCard("Total Labels Created", apiData.totalLabels, "With at least one media"),
                    createStatCard("Total Redo", apiData.totalRedo, "Re-watched and re-read"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Updates per Month", apiData.updatesPerMonth),
                    createStatList("Time Spent (h) / Media Type", apiData.totalHours),
                ],
            },
        },
    ];
};


const createStatCard = (title: string, value: any, subtitle: string, data?: any) => ({
    title: title,
    value: value || "-",
    subtitle: subtitle,
    data: data,
});


const getCardsData = (data: any, suffix = "Watched") => {
    return [
        { title: `Top ${suffix}`, subtitle: `With ${data.topValues[0].value} media`, value: data.topValues[0].name },
        { title: "Top Rated", subtitle: `With a Rating of ${data.topRated[0].value}`, value: data.topRated[0].name },
        { title: "Top Favorited", subtitle: `With ${data.topFavorited[0].value} favorites`, value: data.topFavorited[0].name },
    ];
};


const getListsData = (data: any, suffix = "Watched") => {
    return [
        { title: `Top ${suffix}`, data: data.tovalues },
        { title: "Top Ratings", data: data.topRated },
        { title: "Top Favorited", data: data.topFavorited },
    ];
};


const createStatList = (title: string, data: any) => ({ title, data });


const createRatingStatCard = (ratingSystem: RatingSystemType, avgRating: number, totalRated: number) => {
    return {
        title: "Avg. Rating",
        subtitle: `With ${totalRated} media rated`,
        value: ratingSystem === "score" ? avgRating : getFeelingIcon(avgRating, { size: 25, className: "mt-1.5" }) || "-",
    };
};


const tvData = (apiData: ApiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", apiData.totalEntries, `With ${apiData.totalRedo} Seasons Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(apiData.totalHours), `Watched ${apiData.totalDays} days`),
                    createRatingStatCard(apiData.ratingSystem, apiData.avgRated, apiData.totalRated),
                    createStatCard("Avg. Duration", apiData.avgDuration, "Duration in hours"),
                    createStatCard("Avg. Updates / Month", apiData.avgUpdates, `With ${apiData.totalUpdates} updates`),
                    createStatCard("Top Country", apiData.countries.topValues[0]?.name, `With ${apiData.countries.topValues[0]?.value} media`),
                    createStatCard("Total Episodes", apiData.totalEpisodes, "Cumulated Episodes"),
                    createStatCard("Total Favorites", apiData.totalFavorites, "The best ones"),
                    createStatCard("Total Labels", apiData.totalLabels, "Order maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("First Air Dates", apiData.releaseDates),
                    createStatList("Durations (hours)", apiData.durations),
                    createStatList("Rating", apiData.ratings),
                    createStatList("Updates / Month", apiData.updates),
                ],
            },
            status: apiData.statusCounts,
        },
        {
            sidebarTitle: "Networks Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.networks) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.networks) },
        },
        {
            sidebarTitle: "Actors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.actors) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.actors) },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.genres) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.genres) },
        },
    ];
};


const moviesData = (apiData: ApiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", apiData.totalEntries, `And ${apiData.totalRedo} Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(apiData.totalHours), `Watched ${apiData.totalDays} days`),
                    createRatingStatCard(apiData.ratingSystem, apiData.avgRated, apiData.totalRated),
                    createStatCard("Avg. Duration", apiData.avgDuration, "Duration in minutes"),
                    createStatCard("Avg. Updates / Month", apiData.avgUpdates, `With ${apiData.totalUpdates} updates`),
                    createStatCard(
                        "Top Language",
                        apiData.languages.topValues[0]?.name,
                        `With ${apiData.languages.topValues[0]?.value} media`,
                        (apiData.languages.topValues[0]?.name == null) ? null : apiData.languages.topValues,
                    ),
                    createStatCard("Total Budgets", apiData.totalBudget, "Cumulated budget"),
                    createStatCard("Total Revenue", apiData.totalRevenue, "Cumulated revenue"),
                    createStatCard("Total Favorites", apiData.totalFavorites, "The best ones"),
                    createStatCard("Total Labels", apiData.totalLabels, "Order maniac"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Release dates", apiData.releaseDates),
                    createStatList("Durations", apiData.durations),
                    createStatList("Rating", apiData.ratings),
                    createStatList("Updates / Month", apiData.updates),
                ],
            },
            status: apiData.statusCounts,
        },
        {
            sidebarTitle: "Directors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.directors) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.directors) },
        },
        {
            sidebarTitle: "Actors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.actors) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.actors) },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.genres) },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.genres) },
        },
    ];
};


const booksData = (apiData: ApiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", apiData.total_media.unique, `And ${apiData.total_media.redo} Re-read`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(apiData.total_hours), `Read ${apiData.total_days} days`),
                    createRatingStatCard(apiData.rating_system, apiData.avg_rating, apiData.total_rated),
                    createStatCard("Avg. Pages", apiData.avg_pages, "Big books or small books?"),
                    createStatCard("Avg. Updates / Month", apiData.avg_updates, `With ${apiData.total_updates} updates`),
                    createStatCard(
                        "Top Language",
                        apiData.languages.top_values[0]?.name,
                        `With ${apiData.languages.top_values[0]?.value} media`,
                        (apiData.languages.top_values[0]?.name == null) ? null : apiData.languages.top_values,
                    ),
                    createStatCard("Total Pages", formatNumberWithSpaces(apiData.total_pages), "Cumulated pages"),
                    createStatCard("Total Favorites", apiData.total_favorites, "The best ones"),
                    createStatCard("Total Labels", apiData.total_labels, "Order maniac"),
                    createStatCard("Classic", apiData.misc_genres[1].value, "Much fancy"),
                    createStatCard("Young Adult", apiData.misc_genres[0].value, "Good to be young"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Published Dates", apiData.release_dates),
                    createStatList("Pages", apiData.pages),
                    createStatList("Rating", apiData.ratings),
                    createStatList("Updates / Month", apiData.updates),
                ],
            },
            status: apiData.status_counts,
        },
        {
            sidebarTitle: "Authors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.authors, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.authors, "Read") },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.publishers, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.publishers, "Read") },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.genres, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.genres, "Read") },
        },
    ];
};


const gamesData = (apiData: ApiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", apiData.total_media.total, "--> g@m3rz!? <--"),
                    createStatCard("Time Spent (h)", formatNumberWithKM(apiData.total_hours), `Played ${apiData.total_days} days`),
                    createRatingStatCard(apiData.rating_system, apiData.avg_rating, apiData.total_rated),
                    createStatCard("Avg. Playtime", apiData.avg_playtime, "Playtime in hours"),
                    createStatCard("Avg. Updates / Month", apiData.avg_updates, `With ${apiData.total_updates} updates`),
                    createStatCard(
                        "Top Engine",
                        apiData.engines.top_values[0]?.name,
                        `With ${apiData.engines.top_values[0]?.value} games`,
                        (apiData.engines.top_values[0]?.name == null) ? null : apiData.engines.top_values,
                    ),
                    createStatCard(
                        "Top Perspective",
                        apiData.perspectives.top_values[0]?.name,
                        `With ${apiData.perspectives.top_values[0]?.value} games`,
                        (apiData.perspectives.top_values[0]?.name == null) ? null : apiData.perspectives.top_values,
                    ),
                    createStatCard(
                        "Top Mode",
                        apiData.modes.top_values[0]?.name,
                        `With ${apiData.modes.top_values[0]?.value} games`,
                        (apiData.modes.top_values[0]?.name == null) ? null : apiData.modes.top_values,
                    ),
                    createStatCard("Total Favorites", apiData.total_favorites, "The best ones"),
                    createStatCard("Total Labels", apiData.total_labels, "Order maniac"),
                    createStatCard("Card Games", apiData.misc_genres[0].value, "Patrick Bruel"),
                    createStatCard("Stealth Games", apiData.misc_genres[1].value, "Sneaky sneaky"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Release Dates", apiData.release_dates),
                    createStatList("Playtime (h)", apiData.playtime),
                    createStatList("Rating", apiData.ratings),
                    createStatList("Updates / Month", apiData.updates),
                ],
            },
            status: apiData.status_counts,
        },
        {
            sidebarTitle: "Platforms Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.platforms, "Played") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.platforms, "Played") },
        },
        {
            sidebarTitle: "Developers Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.developers, "Played") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.developers, "Played") },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.publishers, "Played") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.publishers, "Played") },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.genres, "Played") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.genres, "Played") },
        },
    ];
};


const mangaData = (apiData: ApiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", apiData.total_media.unique, `And ${apiData.total_media.redo} Re-read`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(apiData.total_hours), `Read ${apiData.total_days} days`),
                    createRatingStatCard(apiData.rating_system, apiData.avg_rating, apiData.total_rated),
                    createStatCard("Avg. Chapters", apiData.avg_chapters, "Big manga or small manga?"),
                    createStatCard("Avg. Updates / Month", apiData.avg_updates, `With ${apiData.total_updates} updates`),
                    createStatCard("Total Chapters", formatNumberWithSpaces(apiData.total_chapters), "Cumulated chapters"),
                    createStatCard("Total Favorites", apiData.total_favorites, "The best ones"),
                    createStatCard("Total Labels", apiData.total_labels, "Order maniac"),
                    createStatCard("Ecchi", apiData.misc_genres[1].value, ";)"),
                    createStatCard("Shounen", apiData.misc_genres[0].value, "Friendship Powaaaa!"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Published Dates", apiData.release_dates),
                    createStatList("Chapters", apiData.chapters),
                    createStatList("Rating", apiData.ratings),
                    createStatList("Updates / Month", apiData.updates),
                ],
            },
            status: apiData.status_counts,
        },
        {
            sidebarTitle: "Authors Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.authors, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.authors, "Read") },
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.publishers, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.publishers, "Read") },
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: { ...SIDE_CARD_CONFIG, dataList: getCardsData(apiData.genres, "Read") },
            lists: { ...SIDE_LISTS_CONFIG, dataList: getListsData(apiData.genres, "Read") },
        },
    ];
};
