import {formatNumberWithSpaces} from "@/utils/functions";


export const dataToLoad = (mediaType, apiData) => {
    const mediaData = {
        series: tvData,
        anime: tvData,
        movies: moviesData,
        books: booksData,
        games: gamesData,
    };

    return mediaData[mediaType](apiData) || undefined;
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


const tvData = (apiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                cardsPerRow: 4,
                cardsPerPage: 8,
                isCarouselActive: true,
                dataList: [
                    {
                        title: "Total Watched",
                        subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.redo} Re-watched`,
                        value: apiData.values.total_media.total,
                    },
                    {
                        title: "Hours Watched",
                        subtitle: `Watched ${apiData.values.total_days} days`,
                        value: apiData.values.total_hours,
                    },
                    {
                        title: "Average Rating",
                        subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
                        value: apiData.values.avg_rating || "-",
                    },
                    {
                        title: "Average Duration",
                        subtitle: "Duration in hours",
                        value: apiData.values.avg_duration || "-",
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates || "-",
                    },
                    {
                        title: "Top Country",
                        subtitle: `With ${apiData.lists.countries[0].value} media`,
                        value: apiData.lists.countries[0].name || "-",
                        data: (apiData.lists.countries[0]?.name == null) ? null : apiData.lists.countries,
                    },
                    {
                        title: "Total Seasons",
                        subtitle: "Cumulated Seasons",
                        value: apiData.values.total_seasons,
                    },
                    {
                        title: "Total Episodes",
                        subtitle: "Cumulated Episodes",
                        value: apiData.values.total_episodes,
                    },
                    {
                        title: "Total Favorites",
                        subtitle: `The best ones`,
                        value: apiData.values.total_favorites,
                    },
                    {
                        title: "Total Labels",
                        subtitle: "Order maniac",
                        value: apiData.values.total_labels,
                    },
                    {
                        title: "Documentaries",
                        subtitle: "Stranger Than Fiction",
                        value: apiData.values.documentary,
                    },
                    {
                        title: "Kids Shows",
                        subtitle: "Cartoon Frenzy",
                        value: apiData.values.kids,
                    },
                ],
            },
            lists: {
                listsPerRow: 2,
                asGraph: true,
                dataList: [
                    {
                        title: "First Air Dates",
                        data: apiData.lists.release_dates,
                    },
                    {
                        title: "Durations (in hours)",
                        data: apiData.lists.durations,
                    },
                    {
                        title: "Rating",
                        data: apiData.lists.rating,
                    },
                    {
                        title: "Updates Per Month",
                        data: apiData.lists.updates,
                    },
                ],
            }
        },
        {
            sidebarTitle: "Networks Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.networks),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.networks),
            }
        },
        {
            sidebarTitle: "Actors Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.actors),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.actors),
            }
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.genres),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.genres),
            }
        },
    ];
};


const moviesData = (apiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                cardsPerRow: 4,
                cardsPerPage: 8,
                isCarouselActive: true,
                dataList: [
                    {
                        title: "Total Watched",
                        subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.redo} Re-watched`,
                        value: apiData.values.total_media.total,
                    },
                    {
                        title: "Hours Watched",
                        subtitle: `Watched ${apiData.values.total_days} days`,
                        value: apiData.values.total_hours,
                    },
                    {
                        title: "Average Rating",
                        subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
                        value: apiData.values.avg_rating || "-",
                    },
                    {
                        title: "Average Duration",
                        subtitle: "Duration in minutes",
                        value: apiData.values.avg_duration || "-",
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates || "-",
                    },
                    {
                        title: "Top Language",
                        subtitle: `With ${apiData.lists.languages[0].value} movies`,
                        value: apiData.lists.languages[0].name || "-",
                        data: (apiData.lists.languages[0]?.name == null) ? null : apiData.lists.languages,
                    },
                    {
                        title: "Total Budgets",
                        subtitle: "Cumulated budget",
                        value: apiData.values.total_budget,
                    },
                    {
                        title: "Total Revenue",
                        subtitle: "Cumulated revenue",
                        value: apiData.values.total_revenue,
                    },
                    {
                        title: "Total Favorites",
                        subtitle: `The best ones`,
                        value: apiData.values.total_favorites,
                    },
                    {
                        title: "Total Labels",
                        subtitle: "Order maniac",
                        value: apiData.values.total_labels,
                    },
                    {
                        title: "Documentaries",
                        subtitle: "Stranger Than Fiction",
                        value: apiData.values.documentary,
                    },
                    {
                        title: "Animation",
                        subtitle: "Cartoon Frenzy",
                        value: apiData.values.animation,
                    },
                ],
            },
            lists: {
                listsPerRow: 2,
                asGraph: true,
                dataList: [
                    {
                        title: "Release dates",
                        data: apiData.lists.release_dates,
                    },
                    {
                        title: "Durations",
                        data: apiData.lists.durations,
                    },
                    {
                        title: "Rating",
                        data: apiData.lists.rating,
                    },
                    {
                        title: "Updates Per Month",
                        data: apiData.lists.updates,
                    },
                ],
            }
        },
        {
            sidebarTitle: "Directors Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.directors),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.directors),
            }
        },
        {
            sidebarTitle: "Actors Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.actors),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.actors),
            }
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.genres),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.genres),
            }
        },
    ];
};


const booksData = (apiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                cardsPerRow: 4,
                cardsPerPage: 8,
                isCarouselActive: true,
                dataList: [
                    {
                        title: "Total Read",
                        subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.redo} Re-read`,
                        value: apiData.values.total_media.total,
                    },
                    {
                        title: "Hours Read",
                        subtitle: `Read ${apiData.values.total_days} days`,
                        value: apiData.values.total_hours,
                    },
                    {
                        title: "Average Rating",
                        subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
                        value: apiData.values.avg_rating || "-",
                    },
                    {
                        title: "Average Pages",
                        subtitle: "Pages read",
                        value: apiData.values.avg_pages || "-",
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates || "-",
                    },
                    {
                        title: "Top Language",
                        subtitle: `With ${apiData.lists.languages[0].value} books`,
                        value: apiData.lists.languages[0].name || "-",
                        data: (apiData.lists.languages[0]?.name == null) ? null : apiData.lists.languages,
                    },
                    {
                        title: "Total Pages",
                        subtitle: "Cumulated pages",
                        value: formatNumberWithSpaces(apiData.values.total_pages) || "-",
                    },
                    {
                        title: "Total Favorites",
                        subtitle: `The best ones`,
                        value: apiData.values.total_favorites,
                    },
                    {
                        title: "Total Labels",
                        subtitle: "Order maniac",
                        value: apiData.values.total_labels,
                    },
                    {
                        title: "Classic",
                        subtitle: "Much fancy",
                        value: apiData.values.classic,
                    },
                    {
                        title: "Young Adult",
                        subtitle: "Good to be young",
                        value: apiData.values.young_adult,
                    },
                ],
            },
            lists: {
                listsPerRow: 2,
                asGraph: true,
                dataList: [
                    {
                        title: "Published Dates",
                        data: apiData.lists.release_dates,
                    },
                    {
                        title: "Pages",
                        data: apiData.lists.pages,
                    },
                    {
                        title: "Rating",
                        data: apiData.lists.rating,
                    },
                    {
                        title: "Updates Per Month",
                        data: apiData.lists.updates,
                    },
                ],
            }
        },
        {
            sidebarTitle: "Authors Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.authors, "Read"),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.authors, "Read"),
            }
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.publishers, "Read"),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.publishers, "Read"),
            }
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.genres, "Read"),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.genres, "Read"),
            }
        },
    ];
};


const gamesData = (apiData) => {
    return [
        {
            sidebarTitle: "Main Statistics",
            cards: {
                cardsPerRow: 4,
                cardsPerPage: 8,
                isCarouselActive: true,
                dataList: [
                    {
                        title: "Total Played",
                        subtitle: "Games played",
                        value: apiData.values.total_media,
                    },
                    {
                        title: "Hours Played",
                        subtitle: `Played ${apiData.values.total_days} days`,
                        value: formatNumberWithSpaces(apiData.values.total_hours),
                    },
                    {
                        title: "Average Playtime",
                        subtitle: `Playtime in hours`,
                        value: apiData.values.avg_playtime || "-",
                    },
                    {
                        title: "Average Rating",
                        subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
                        value: apiData.values.avg_rating || "-",
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates || "-",
                    },
                    {
                        title: "Top Engine",
                        subtitle: `With ${apiData.lists.engines[0].value} games`,
                        value: apiData.lists.engines[0].name || "-",
                        data: (apiData.lists.engines[0]?.name == null) ? null : apiData.lists.engines,
                    },
                    {
                        title: "Top Perspective",
                        subtitle: `With ${apiData.lists.perspectives[0].value} games`,
                        value: apiData.lists.perspectives[0].name || "-",
                        data: (apiData.lists.perspectives[0]?.name == null) ? null : apiData.lists.perspectives,
                    },
                    {
                        title: "Top Mode",
                        subtitle: `With ${apiData.lists.modes[0].value} games`,
                        value: apiData.lists.modes[0].name || "-",
                        data: (apiData.lists.modes[0]?.name == null) ? null : apiData.lists.modes,
                    },
                    {
                        title: "Total Favorites",
                        subtitle: `The best ones`,
                        value: apiData.values.total_favorites,
                    },
                    {
                        title: "Total Labels",
                        subtitle: "Order maniac",
                        value: apiData.values.total_labels,
                    },
                    {
                        title: "Card Games",
                        subtitle: "Patrick Bruel",
                        value: apiData.values.card_game,
                    },
                    {
                        title: "Stealth Games",
                        subtitle: "Sneaky sneaky",
                        value: apiData.values.stealth,
                    },
                ],
            },
            lists: {
                listsPerRow: 2,
                asGraph: true,
                dataList: [
                    {
                        title: "Release Dates",
                        data: apiData.lists.release_dates,
                    },
                    {
                        title: "Playtime (in hours)",
                        data: apiData.lists.playtime,
                    },
                    {
                        title: "Rating",
                        data: apiData.lists.rating,
                    },
                    {
                        title: "Updates (per Month)",
                        data: apiData.lists.updates,
                    },
                ],
            }
        },
        {
            sidebarTitle: "Platforms Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.platforms, "Played"),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.platforms, "Played"),
            }
        },
        {
            sidebarTitle: "Developers Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.developers, "Played"),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.developers, "Played"),
            }
        },
        {
            sidebarTitle: "Publishers Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.publishers, "Played"),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.publishers, "Played"),
            }
        },
        {
            sidebarTitle: "Genres Statistics",
            cards: {
                cardsPerRow: 3,
                cardsPerPage: 3,
                isCarouselActive: false,
                dataList: getCardsData(apiData.lists.genres, "Played"),
            },
            lists: {
                listsPerRow: 3,
                asGraph: false,
                dataList: getListsData(apiData.lists.genres, "Played"),
            }
        },
    ];
};