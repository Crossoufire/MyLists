import {useState} from "react";
import {FaList} from "react-icons/fa6";
import {ResponsiveBar} from "@nivo/bar";
import {barTheme} from "@/lib/constants";
import {fetcher} from "@/lib/fetcherLoader";
import {Button} from "@/components/ui/button";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {createFileRoute} from "@tanstack/react-router";
import {FaQuestionCircle, FaTimes} from "react-icons/fa";
import {UserComboBox} from "@/components/app/UserComboBox";
import {capitalize, changeValueFormat, cn} from "@/lib/utils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/stats/$mediaType/$username")({
    component: StatsPage,
    loader: async ({ params }) => fetcher(`/stats/${params.mediaType}/${params.username}`),
});


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
                        subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.rewatched} Rewatched`,
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
                        value: apiData.values.avg_rating,
                    },
                    {
                        title: "Average Duration",
                        subtitle: "Duration in hours",
                        value: apiData.values.avg_duration,
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates,
                    },
                    {
                        title: "Top Country",
                        subtitle: `With ${apiData.lists.countries[0].value} media`,
                        value: apiData.lists.countries[0].name,
                        data: apiData.lists.countries,
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
                        subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.rewatched} Rewatched`,
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
                        value: apiData.values.avg_rating,
                    },
                    {
                        title: "Average Duration",
                        subtitle: "Duration in minutes",
                        value: apiData.values.avg_duration,
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates,
                    },
                    {
                        title: "Top Language",
                        subtitle: `With ${apiData.lists.languages[0].value} movies`,
                        value: apiData.lists.languages[0].name,
                        data: apiData.lists.languages,
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
                        subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.rewatched} Re-read`,
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
                        value: apiData.values.avg_rating,
                    },
                    {
                        title: "Average Pages",
                        subtitle: "Pages read",
                        value: apiData.values.avg_pages,
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates,
                    },
                    {
                        title: "Top Language",
                        subtitle: `With ${apiData.lists.languages[0].value} books`,
                        value: apiData.lists.languages[0].name,
                        data: apiData.lists.languages,
                    },
                    {
                        title: "Total Pages",
                        subtitle: "Cumulated pages",
                        value: changeValueFormat(apiData.values.total_pages),
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
                        value: changeValueFormat(apiData.values.total_hours),
                    },
                    {
                        title: "Average Playtime",
                        subtitle: `Playtime in hours`,
                        value: apiData.values.avg_playtime,
                    },
                    {
                        title: "Average Rating",
                        subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
                        value: apiData.values.avg_rating,
                    },
                    {
                        title: "Average Updates",
                        subtitle: "Updates per month",
                        value: apiData.values.avg_updates,
                    },
                    {
                        title: "Top Engine",
                        subtitle: `With ${apiData.lists.engines[0].value} games`,
                        value: apiData.lists.engines[0].name,
                        data: apiData.lists.engines,
                    },
                    {
                        title: "Top Perspective",
                        subtitle: `With ${apiData.lists.perspectives[0].value} games`,
                        value: apiData.lists.perspectives[0].name,
                        data: apiData.lists.perspectives,
                    },
                    {
                        title: "Top Mode",
                        subtitle: `With ${apiData.lists.modes[0].value} games`,
                        value: apiData.lists.modes[0].name,
                        data: apiData.lists.modes,
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

const dataToLoad = (mediaType, apiData) => {
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
        {title: `Top ${suffix}`, subtitle: `With ${data.top_values[0].value} media`, value: data.top_values[0].name},
        {title: "Top Rated", subtitle: `With a Rating of ${data.top_rated[0].value}`, value: data.top_rated[0].name},
        {title: "Top Favorited", subtitle: `With ${data.top_favorited[0].value} favorites`, value: data.top_favorited[0].name},
    ];
};

const getListsData = (data, suffix = "Watched") => {
    return [
        {title: `Top ${suffix}`, data: data.top_values},
        {title: "Top Ratings", data: data.top_rated},
        {title: "Top Favorited", data: data.top_favorited},
    ];
};


function StatsPage() {
    const apiData = Route.useLoaderData();
    const { mediaType, username } = Route.useParams();
    const [otherUser, setOtherUser] = useState("");
    const [feelingInfo, setFeelingInfo] = useState(true);
    const [statsDataOtherUser, setStatsDataOtherUser] = useState([]);
    const [selectedTab, setSelectedTab] = useState("Main Statistics");
    const statsData = dataToLoad(mediaType, apiData.stats);

    const addComparison = async (user) => {
        const otherData = await fetcher(`/stats/${mediaType}/${user}`);
        setStatsDataOtherUser(dataToLoad(mediaType, otherData.stats));
        setOtherUser(user);
    };

    const resetComparison = () => {
        setOtherUser("");
        setStatsDataOtherUser([]);
    };

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Stats`} subtitle="Detailed stats for the user">
            <div className="flex items-center gap-4 m-4 ml-0 max-sm:justify-center">
                {apiData.is_current &&
                    <>
                        <div>Compare with</div>
                        <div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div role="button"><FaQuestionCircle/></div>
                                </PopoverTrigger>
                                <PopoverContent>
                                    Comparison between users is solely based on card statistics, excluding tables and
                                    graphs.
                                </PopoverContent>
                            </Popover>
                        </div>
                        <UserComboBox
                            resetValue={otherUser}
                            dataList={apiData.users}
                            callback={addComparison}
                        />
                        {otherUser &&
                            <Tooltip text="Remove comparison" side="right">
                                <div role="button" onClick={resetComparison}>
                                    <FaTimes/>
                                </div>
                            </Tooltip>
                        }
                    </>
                }
            </div>
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <nav className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
                    {statsData.map(data =>
                        <Button key={data.sidebarTitle} className="justify-start text-base"
                                onClick={() => setSelectedTab(data.sidebarTitle)}
                                variant={selectedTab === data.sidebarTitle ? "secondary" : "ghost"}>
                            {data.sidebarTitle}
                        </Button>
                    )}
                </nav>
                <div>
                    {(apiData.is_feeling && feelingInfo) &&
                        <div className="mb-4 p-3 bg-cyan-900/80 rounded-md">
                            <div role="button" className="relative" onClick={() => setFeelingInfo(false)}>
                                <FaTimes className="absolute right-0 opacity-80"/>
                            </div>
                            <div className="text-lg font-medium">Feeling rating</div>
                            <p>The feeling system was converted from 0 to 5 for convenience and clarity</p>
                        </div>
                    }
                    <DisplayStats
                        statsData={statsData.find(data => data.sidebarTitle === selectedTab)}
                        otherUserStatsData={statsDataOtherUser?.find(data => data.sidebarTitle === selectedTab)}
                    />
                </div>
            </div>
        </PageTitle>
    );
}


const DisplayStats = ({ statsData, otherUserStatsData }) => {
    return (
        <>
            {statsData.cards.isCarouselActive ?
                <Carousel>
                    <CarouselContent>
                        <CarouselItem>
                            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:mt-4">
                                {statsData.cards.dataList.map((data, idx) => {
                                    if (idx >= statsData.cards.cardsPerPage) return;
                                    return (
                                        <StatsCard
                                            key={idx}
                                            data={data}
                                            otherData={otherUserStatsData?.cards.dataList[idx]}
                                        />
                                    );
                                })}
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:mt-4">
                                {statsData.cards.dataList.map((data, idx) => {
                                    if (idx <= statsData.cards.cardsPerPage - 1) return;
                                    return (
                                        <StatsCard
                                            key={idx}
                                            data={data}
                                            otherData={otherUserStatsData?.cards.dataList[idx]}
                                        />
                                    );
                                })}
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious/>
                    <CarouselNext/>
                </Carousel>
                :
                <div className={cn("grid gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:mt-4",
                    statsData.cards.dataList.cardsPerRow === 4 ? "grid-cols-4" : "grid-cols-3")}>
                    {statsData.cards.dataList.map((data, idx) => {
                        return (
                            <StatsCard
                                key={idx}
                                data={data}
                                otherData={otherUserStatsData?.cards.dataList[idx]}
                            />
                        );
                    })}
                </div>
            }
            <div className={cn("grid max-lg:grid-cols-1 max-sm:gap-4 gap-x-6 mt-6",
                statsData.lists.listsPerRow === 3 ? "grid-cols-3" : "grid-cols-2")}>
                {statsData.lists.dataList.map((data, idx) =>
                    <div key={idx} className="mt-2">
                        <ListData
                            key={idx}
                            data={data}
                            asGraph={statsData.lists.asGraph}
                        />
                    </div>
                )}
            </div>
        </>
    );
};


const StatsCard = ({ data, otherData }) => {
    return (
        <Card className="flex flex-col lg:min-w-[250px]">
            <CardHeader>
                <CardTitle className="justify-between max-sm:text-base">
                    <div>{data.title}</div>
                    {(data.data && !otherData) &&
                        <Popover>
                            <Tooltip text="Details">
                                <PopoverTrigger>
                                    <FaList className="opacity-50 hover:opacity-100"/>
                                </PopoverTrigger>
                            </Tooltip>
                            <PopoverContent align="end" className="max-h-[500px] overflow-auto">
                                <ListData
                                    data={data}
                                    asGraph={false}
                                />
                            </PopoverContent>
                        </Popover>
                    }
                </CardTitle>
                <CardDescription>{data.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className={cn("grid items-center", otherData ? "grid-cols-[1fr_0fr_1fr]" : "grid-cols-1")}>
                <div className={cn("text-3xl font-bold max-sm:text-xl", otherData && "text-2xl text-center")} title={data.value}>
                    {data.value}
                </div>
                {otherData &&
                    <>
                        <Separator variant="vertical" className="mx-3 h-full bg-neutral-600"/>
                        <div className="text-2xl font-bold max-sm:text-xl text-center" title={otherData.value}>
                            {typeof otherData.value === "number" || otherData.title === "Total Budgets" || otherData.title === "Total Revenue" ?
                                <span className={otherData.value > data.value ? "text-green-400" : "text-red-400"}>
                                    {otherData.value}
                                </span>
                                :
                                otherData.value
                            }
                        </div>
                    </>
                }
            </CardContent>
        </Card>
    );
};


const ListData = ({ data, asGraph }) => {
    return (
        <>
            {asGraph ?
                <StatsGraph
                    title={data.title}
                    dataList={data.data}
                />
                :
                <StatsTable
                    title={data.title}
                    dataList={data.data}
                />
            }
        </>
    );
};


const StatsGraph = ({ title, dataList }) => {
    return (
        <div>
            <div className="text-2xl font-bold">{title} Distribution <Separator/></div>
            <div className="flex items-center h-[380px]">
                <ResponsiveBar
                    animate={true}
                    padding={0.25}
                    data={dataList}
                    theme={barTheme}
                    indexBy={"name"}
                    labelSkipWidth={20}
                    labelSkipHeight={16}
                    isInteractive={true}
                    colorBy={"indexValue"}
                    axisBottom={{ tickRotation: -30 }}
                    margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                />
            </div>
        </div>
    );
};


const StatsTable = ({ title, dataList }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow className="text-base">
                    <TableHead>#</TableHead>
                    <TableHead>{title}</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {dataList.map((data, idx) => (
                    <TableRow key={idx} className="text-base">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell title={data.name}>{data.name}</TableCell>
                        <TableCell>{data.value}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
