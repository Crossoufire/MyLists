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
export const Route = createFileRoute("/_private/stats/old/$mediaType/$username")({
    component: StatsPage,
    loader: async ({ params }) => fetcher(`/stats/${params.mediaType}/${params.username}`),
});


const tvData = (apiData) => {
    const mainData = [
        {
            title: "Total Watched",
            subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.rewatched} Rewatched`,
            topValue: apiData.values.total_media.total,
        },
        {
            title: "Hours Watched",
            subtitle: `Watched ${apiData.values.total_days} days`,
            topValue: apiData.values.total_hours,
        },
        {
            title: "Average Rating",
            subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
            topValue: apiData.values.avg_rating,
        },
        {
            title: "Average Duration",
            subtitle: "Duration in hours",
            topValue: apiData.values.avg_duration,
        },
        {
            title: "Average Updates",
            subtitle: "Updates per month",
            topValue: apiData.values.avg_updates,
        },
        {
            title: "Top Country",
            subtitle: `With ${apiData.lists.countries[0].value} media`,
            topValue: apiData.lists.countries[0].name,
            list: apiData.lists.countries,
        },
        {
            title: "Total Seasons",
            subtitle: "Cumulated Seasons",
            topValue: apiData.values.total_seasons,
        },
        {
            title: "Total Episodes",
            subtitle: "Cumulated Episodes",
            topValue: apiData.values.total_episodes,
        },
        {
            title: "Total Favorites",
            subtitle: `The best ones`,
            topValue: apiData.values.total_favorites,
            page: 2,
        },
        {
            title: "Total Labels",
            subtitle: "Order maniac",
            topValue: apiData.values.total_labels,
            page: 2,
        },
        {
            title: "Documentaries",
            subtitle: "Stranger Than Fiction",
            topValue: apiData.values.documentary,
            page: 2,
        },
        {
            title: "Kids Shows",
            subtitle: "Cartoon Frenzy",
            topValue: apiData.values.kids,
            page: 2,
        },
        {
            type: "list",
            title: "First Air Dates",
            list: apiData.lists.release_dates,
        },
        {
            type: "list",
            title: "Durations (in hours)",
            list: apiData.lists.durations,
        },
        {
            type: "list",
            title: "Rating",
            list: apiData.lists.rating,
        },
        {
            type: "list",
            title: "Updates Per Month",
            list: apiData.lists.updates,
        },
    ];
    const networksData = getCategoryData(apiData.lists.networks);
    const actorsData = getCategoryData(apiData.lists.actors);
    const genresData = getCategoryData(apiData.lists.genres);
    const miscData = [

    ];

    return [
        {label: "Main Statistics", data: mainData},
        {label: "Networks Statistics", data: networksData},
        {label: "Actors Statistics", data: actorsData},
        {label: "Genres Statistics", data: genresData},
        {label: "Misc Statistics", data: miscData},
    ];
};

const moviesData = (apiData) => {
    const mainData = [
        {
            title: "Total Watched",
            subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.rewatched} Rewatched`,
            topValue: apiData.values.total_media.total,
        },
        {
            title: "Hours Watched",
            subtitle: `Watched ${apiData.values.total_days} days`,
            topValue: apiData.values.total_hours,
        },
        {
            title: "Average Rating",
            subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
            topValue: apiData.values.avg_rating,
        },
        {
            title: "Average Duration",
            subtitle: "Duration in minutes",
            topValue: apiData.values.avg_duration,
        },
        {
            title: "Average Updates",
            subtitle: "Updates per month",
            topValue: apiData.values.avg_updates,
        },
        {
            title: "Top Language",
            subtitle: `With ${apiData.lists.languages[0].value} movies`,
            topValue: apiData.lists.languages[0].name,
            list: apiData.lists.languages,
        },
        {
            title: "Total Budgets",
            subtitle: "Cumulated budget",
            topValue: apiData.values.total_budget,
        },
        {
            title: "Total Revenue",
            subtitle: "Cumulated revenue",
            topValue: apiData.values.total_revenue,
        },
        {
            type: "list",
            title: "Release dates",
            list: apiData.lists.release_dates,
        },
        {
            type: "list",
            title: "Durations",
            list: apiData.lists.durations,
        },
        {
            type: "list",
            title: "Rating",
            list: apiData.lists.rating,
        },
        {
            type: "list",
            title: "Updates Per Month",
            list: apiData.lists.updates,
        },
    ];
    const directorsData = getCategoryData(apiData.lists.directors);
    const actorsData = getCategoryData(apiData.lists.actors);
    const genresData = getCategoryData(apiData.lists.genres);
    const miscData = [
        {
            title: "Total Favorites",
            subtitle: `The best ones`,
            topValue: apiData.values.total_favorites,
        },
        {
            title: "Total Labels",
            subtitle: "Order maniac",
            topValue: apiData.values.total_labels,
        },
        {
            title: "Documentaries",
            subtitle: "Stranger Than Fiction",
            topValue: apiData.values.documentary,
        },
        {
            title: "Animation",
            subtitle: "Cartoon Frenzy",
            topValue: apiData.values.animation,
        },
    ];

    return [
        {label: "Main Statistics", data: mainData},
        {label: "Directors Statistics", data: directorsData},
        {label: "Actors Statistics", data: actorsData},
        {label: "Genres Statistics", data: genresData},
        {label: "Misc Statistics", data: miscData},
    ];
};

const booksData = (apiData) => {
    const mainData = [
        {
            title: "Total Read",
            subtitle: `${apiData.values.total_media.unique} Unique - ${apiData.values.total_media.rewatched} Re-read`,
            topValue: apiData.values.total_media.total,
        },
        {
            title: "Hours Read",
            subtitle: `Read ${apiData.values.total_days} days`,
            topValue: apiData.values.total_hours,
        },
        {
            title: "Average Rating",
            subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
            topValue: apiData.values.avg_rating,
        },
        {
            title: "Average Pages",
            subtitle: "Pages read",
            topValue: apiData.values.avg_pages,
        },
        {
            title: "Average Updates",
            subtitle: "Updates per month",
            topValue: apiData.values.avg_updates,
        },
        {
            title: "Top Language",
            subtitle: `With ${apiData.lists.languages[0].value} books`,
            topValue: apiData.lists.languages[0].name,
            list: apiData.lists.languages,
        },
        {
            title: "Total Pages",
            subtitle: "Cumulated pages",
            topValue: changeValueFormat(apiData.values.total_pages),
        },
        {
            type: "list",
            title: "Published Dates",
            list: apiData.lists.release_dates,
        },
        {
            type: "list",
            title: "Pages",
            list: apiData.lists.pages,
        },
        {
            type: "list",
            title: "Rating",
            list: apiData.lists.rating,
        },
        {
            type: "list",
            title: "Updates Per Month",
            list: apiData.lists.updates,
        },
    ];
    const authorsData = getCategoryData(apiData.lists.authors, "Read");
    const publishersData = getCategoryData(apiData.lists.publishers, "Read");
    const genresData = getCategoryData(apiData.lists.genres, "Read");
    const miscData = [
        {
            title: "Total Favorites",
            subtitle: `The best ones`,
            topValue: apiData.values.total_favorites,
        },
        {
            title: "Total Labels",
            subtitle: "Order maniac",
            topValue: apiData.values.total_labels,
        },
        {
            title: "Classic",
            subtitle: "Much fancy",
            topValue: apiData.values.classic,
        },
        {
            title: "Young Adult",
            subtitle: "Good to be young",
            topValue: apiData.values.young_adult,
        },
    ];

    return [
        {label: "Main Statistics", data: mainData},
        {label: "Authors Statistics", data: authorsData},
        {label: "Publishers Statistics", data: publishersData},
        {label: "Genres Statistics", data: genresData},
        {label: "Misc Statistics", data: miscData},
    ];
};

const gamesData = (apiData) => {
    const mainData = [
        {
            title: "Total Played",
            subtitle: "Games played",
            topValue: apiData.values.total_media,
        },
        {
            title: "Hours Played",
            subtitle: `Played ${apiData.values.total_days} days`,
            topValue: changeValueFormat(apiData.values.total_hours),
        },
        {
            title: "Average Playtime",
            subtitle: `Playtime in hours`,
            topValue: apiData.values.avg_playtime,
        },
        {
            title: "Average Rating",
            subtitle: apiData.is_feeling ? "Most common feeling" : "Scored from 0 - 10",
            topValue: apiData.values.avg_rating,
        },
        {
            title: "Average Updates",
            subtitle: "Updates per month",
            topValue: apiData.values.avg_updates,
        },
        {
            title: "Top Engine",
            subtitle: `With ${apiData.lists.engines[0].value} games`,
            topValue: apiData.lists.engines[0].name,
            list: apiData.lists.engines,
        },
        {
            title: "Top Perspective",
            subtitle: `With ${apiData.lists.perspectives[0].value} games`,
            topValue: apiData.lists.perspectives[0].name,
            list: apiData.lists.perspectives,
        },
        {
            title: "Top Mode",
            subtitle: `With ${apiData.lists.modes[0].value} games`,
            topValue: apiData.lists.modes[0].name,
            list: apiData.lists.modes,
        },
        {
            type: "list",
            title: "Release Dates",
            list: apiData.lists.release_dates,
        },
        {
            type: "list",
            title: "Playtime (in hours)",
            list: apiData.lists.playtime,
        },
        {
            type: "list",
            title: "Rating",
            list: apiData.lists.rating,
        },
        {
            type: "list",
            title: "Updates (per Month)",
            list: apiData.lists.updates,
        },
    ];
    const developersData = getCategoryData(apiData.lists.developers, "Played");
    const publishersData = getCategoryData(apiData.lists.publishers, "Played");
    const platformsData = getCategoryData(apiData.lists.platforms, "Played");
    const genresData = getCategoryData(apiData.lists.genres, "Played");
    const miscData = [
        {
            title: "Total Favorites",
            subtitle: `The best ones`,
            topValue: apiData.values.total_favorites,
        },
        {
            title: "Total Labels",
            subtitle: "Order maniac",
            topValue: apiData.values.total_labels,
        },
        {
            title: "Card Games",
            subtitle: "Patrick Bruel",
            topValue: apiData.values.card_game,
        },
        {
            title: "Stealth Games",
            subtitle: "Sneaky sneaky",
            topValue: apiData.values.stealth,
        },
    ];

    return [
        {label: "Main Statistics", data: mainData},
        {label: "Developers Statistics", data: developersData},
        {label: "Publishers Statistics", data: publishersData},
        {label: "Platforms Statistics", data: platformsData},
        {label: "Genres Statistics", data: genresData},
        {label: "Misc Statistics", data: miscData},
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

const getCategoryData = (data, suffix = "Watched") => {
    return [
        {title: `Top ${suffix}`, subtitle: `With ${data.top_values[0].value} media`, topValue: data.top_values[0].name},
        {title: "Top Rated", subtitle: `With a Rating of ${data.top_rated[0].value}`, topValue: data.top_rated[0].name},
        {title: "Top Favorited", subtitle: `With ${data.top_favorited[0].value} favorites`, topValue: data.top_favorited[0].name},
        {type: "list", title: `Top ${suffix}`, list: data.top_values, asGraph: false},
        {type: "list", title: "Top Ratings", list: data.top_rated, asGraph: false},
        {type: "list", title: "Top Favorited", list: data.top_favorited, asGraph: false},
    ];
};


function StatsPage() {
    const apiData = Route.useLoaderData();
    const { mediaType, username } = Route.useParams();
    const [otherUser, setOtherUser] = useState("");
    const [tabConfig2, setTabConfig2] = useState([]);
    const [feelingInfo, setFeelingInfo] = useState(true);
    const [selectedTab, setSelectedTab] = useState("Main Statistics");
    const tabConfig = dataToLoad(mediaType, apiData.stats);

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    const addComparison = async (user) => {
        const otherData = await fetcher(`/stats/${mediaType}/${user}`);
        setTabConfig2(dataToLoad(mediaType, otherData.stats));
        setOtherUser(user);
    };

    const resetComparison = () => {
        setOtherUser("");
        setTabConfig2([]);
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
                <nav
                    className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
                    {tabConfig.map(tab =>
                        <Button key={tab.label} className="justify-start text-base" onClick={() => handleTabChange(tab.label)}
                                variant={selectedTab === tab.label ? "secondary" : "ghost"}>
                            {tab.label}
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
                        data={tabConfig.find(tab => tab.label === selectedTab).data}
                        data2={tabConfig2.find(tab => tab.label === selectedTab)?.data}
                    />
                </div>
            </div>
        </PageTitle>
    );
}


const DisplayStats = ({ data, data2 }) => {
    const listData = data.filter(info => info.type === "list");
    const cardsData = data.filter(info => info.type === undefined);
    const cardsData2 = data2?.filter(info => info.type === undefined);

    return (
        <>
            <Carousel opts={{ duration: 25, loop: true }} className="max-sm:w-[85%]">
                <CarouselContent>
                    <CarouselItem>
                        <div className={cn("grid gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:mt-4",
                            cardsData.length > 3 ? "grid-cols-4" : "grid-cols-3")}>
                            {cardsData.map((data, idx) => {
                                if (data?.page) return;
                                return (
                                    <StatsCard
                                        key={idx}
                                        data={data}
                                        title={data.title}
                                        subtitle={data.subtitle}
                                        data2={cardsData2 && cardsData2[idx]}
                                    />
                                );
                            })}
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                        <div className={cn("grid gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:mt-4",
                            cardsData.length > 3 ? "grid-cols-4" : "grid-cols-3")}>
                            {cardsData.map((data, idx) => {
                                if (!data?.page) return;
                                return (
                                    <StatsCard
                                        key={idx}
                                        data={data}
                                        title={data.title}
                                        subtitle={data.subtitle}
                                        data2={cardsData2 && cardsData2[idx]}
                                    />
                                );
                            })}
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious/>
                <CarouselNext/>
            </Carousel>
            <div className={cn("grid max-lg:grid-cols-1 max-sm:gap-4 gap-x-6 mt-6",
                listData.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
                {listData.map((data, idx) =>
                    <div key={idx} className="mt-2">
                        <ListData
                            title={data.title}
                            dataList={data.list}
                            asGraph={data.asGraph}
                        />
                    </div>
                )}
            </div>
        </>
    );
};


const StatsCard = ({ title, subtitle, data, data2 }) => {
    return (
        <Card className="flex flex-col lg:min-w-[250px]">
            <CardHeader>
                <CardTitle className="justify-between max-sm:text-base">
                    <div>{title}</div>
                    {(data.list && !data2) &&
                        <Popover>
                            <Tooltip text="Details">
                                <PopoverTrigger>
                                    <FaList className="opacity-50 hover:opacity-100"/>
                                </PopoverTrigger>
                            </Tooltip>
                            <PopoverContent align="end" className="max-h-[500px] overflow-auto">
                                <ListData
                                    title={title}
                                    asGraph={false}
                                    dataList={data.list}
                                />
                            </PopoverContent>
                        </Popover>
                    }
                </CardTitle>
                <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent className={cn("grid items-center", data2 ? "grid-cols-[1fr_0fr_1fr]" : "grid-cols-1")}>
                <div className={cn("text-3xl font-bold max-sm:text-xl", data2 && "text-2xl text-center")} title={data.topValue}>
                    {data.topValue}
                </div>
                {data2 &&
                    <>
                        <Separator variant="vertical" className="mx-3 h-full bg-neutral-600"/>
                        <div className="text-2xl font-bold max-sm:text-xl text-center" title={data2.topValue}>
                            {typeof data2.topValue === "number" || data2.title === "Total Budgets" || data2.title === "Total Revenue" ?
                                <span className={data2.topValue > data.topValue ? "text-green-400" : "text-red-400"}>
                                    {data2.topValue}
                                </span>
                                :
                                data2.topValue
                            }
                        </div>
                    </>
                }
            </CardContent>
        </Card>
    );
};


const ListData = ({title, dataList, asGraph = true}) => {
    return (
        <>
            {asGraph ?
                <StatsGraph
                    title={title}
                    dataList={dataList}
                />
                :
                <StatsTable
                    title={title}
                    dataList={dataList}
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
