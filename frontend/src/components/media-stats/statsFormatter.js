import {formatNumberWithKM, formatNumberWithSpaces, getFeelingIcon} from "@/utils/functions";


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


export const dataToLoad = (mediaType, apiData, forUser = false) => {
    if (!mediaType) {
        return globalData(apiData, forUser);
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


const getCardsData = (data, suffix = "Watched") => {
    return [
        { title: `Top ${suffix}`, subtitle: `With ${data.top_values[0].value} media`, value: data.top_values[0].name },
        { title: "Top Rated", subtitle: `With a Rating of ${data.top_rated[0].value}`, value: data.top_rated[0].name },
        { title: "Top Favorited", subtitle: `With ${data.top_favorited[0].value} favorites`, value: data.top_favorited[0].name },
    ];
};


const getListsData = (data, suffix = "Watched") => {
    return [
        { title: `Top ${suffix}`, data: data.top_values },
        { title: "Top Ratings", data: data.top_rated },
        { title: "Top Favorited", data: data.top_favorited },
    ];
};


const createStatCard = (title, value, subtitle, data) => ({
    title: title,
    value: value || "-",
    subtitle: subtitle,
    data: data,
});


const createStatList = (title, data) => ({
    title,
    data,
});


const createRatingStatCard = (ratingSystem, avgRating, totalRated) => {
    return {
        title: "Avg. Rating",
        value: ratingSystem === "score" ? avgRating : getFeelingIcon(avgRating, { size: 25, className: "mt-1.5" }) || "-",
        subtitle: `With ${totalRated} media rated`,
    };
};


const tvData = (apiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", apiData.total_media.unique, `And ${apiData.total_media.redo} Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(apiData.total_hours), `Watched ${apiData.total_days} days`),
                    createRatingStatCard(apiData.rating_system, apiData.avg_rating, apiData.total_rated),
                    createStatCard("Avg. Duration", apiData.avg_duration, "Duration in hours"),
                    createStatCard("Avg. Updates / Month", apiData.avg_updates, `With ${apiData.total_updates} updates`),
                    createStatCard("Top Country", apiData.countries.top_values[0]?.name, `With ${apiData.countries.top_values[0]?.value} media`),
                    createStatCard("Total Episodes", apiData.total_episodes, "Cumulated Episodes"),
                    createStatCard("Total Favorites", apiData.total_favorites, "The best ones"),
                    createStatCard("Total Labels", apiData.total_labels, "Order maniac"),
                    createStatCard("Documentaries", apiData.misc_genres[0].value, "Stranger Than Fiction"),
                    createStatCard("Kids Shows", apiData.misc_genres[1].value, "Cartoon Frenzy"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("First Air Dates", apiData.release_dates),
                    createStatList("Durations (hours)", apiData.durations),
                    createStatList("Rating", apiData.ratings),
                    createStatList("Updates / Month", apiData.updates),
                ],
            },
            status: apiData.status_counts,
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


const moviesData = (apiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    createStatCard("Total Entries", apiData.total_media.unique, `And ${apiData.total_media.redo} Re-watched`),
                    createStatCard("Time Spent (h)", formatNumberWithKM(apiData.total_hours), `Watched ${apiData.total_days} days`),
                    createRatingStatCard(apiData.rating_system, apiData.avg_rating, apiData.total_rated),
                    createStatCard("Avg. Duration", apiData.avg_duration, "Duration in minutes"),
                    createStatCard("Avg. Updates / Month", apiData.avg_updates, `With ${apiData.total_updates} updates`),
                    createStatCard(
                        "Top Language",
                        apiData.languages.top_values[0]?.name,
                        `With ${apiData.languages.top_values[0]?.value} media`,
                        (apiData.languages.top_values[0]?.name == null) ? null : apiData.languages.top_values,
                    ),
                    createStatCard("Total Budgets", apiData.total_budget, "Cumulated budget"),
                    createStatCard("Total Revenue", apiData.total_revenue, "Cumulated revenue"),
                    createStatCard("Total Favorites", apiData.total_favorites, "The best ones"),
                    createStatCard("Total Labels", apiData.total_labels, "Order maniac"),
                    createStatCard("Documentaries", apiData.misc_genres[0].value, "Stranger Than Fiction"),
                    createStatCard("Animation", apiData.misc_genres[1].value, "Cartoon Frenzy"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Release dates", apiData.release_dates),
                    createStatList("Durations", apiData.durations),
                    createStatList("Rating", apiData.ratings),
                    createStatList("Updates / Month", apiData.updates),
                ],
            },
            status: apiData.status_counts,
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


const booksData = (apiData) => {
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


const gamesData = (apiData) => {
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


const mangaData = (apiData) => {
    console.log(apiData);
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


const globalData = (apiData, forUser = false) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                ...MAIN_CARDS_CONFIG,
                dataList: [
                    ...(forUser ? [] : [createStatCard("Total Active Users", apiData.total_users, "At least one media list")]),
                    createStatCard("Total Entries", apiData.total_entries, "Cumulated media entries"),
                    createStatCard("Total Time Spent", `${(apiData.total_time_spent / 60 / 24 / 365).toFixed(1)}`, "Cumulated time in years!"),
                    createStatCard("Total Achievements", apiData.total_achievements, "Platinum tiers!"),
                    createRatingStatCard(apiData.rating_system, apiData.avg_rating, apiData.total_rated),
                    createStatCard(`Avg. Favorites / ${forUser ? "Type" : "User"}`, apiData.avg_favorites, `With ${apiData.total_favorites} favorites`),
                    createStatCard(`Avg. Comments / ${forUser ? "Type" : "User"}`, apiData.avg_comments, `With ${apiData.total_commented} comments`),
                    createStatCard("Avg. Updates / Month", apiData.avg_updates, `With ${apiData.total_updates} updates`),
                    createStatCard("Total Labels Created", apiData.total_labels, "With at least one media"),
                    createStatCard("Total Redo", apiData.total_redo, "Re-watched and re-read"),
                ],
            },
            lists: {
                ...MAIN_GRAPHS_CONFIG,
                dataList: [
                    createStatList("Time Spent (h) / Media Type", apiData.time_spent),
                    createStatList("Updates per Month", apiData.updates),
                ],
            },
        },
    ];
};
