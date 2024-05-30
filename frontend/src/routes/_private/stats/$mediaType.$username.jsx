import {useState} from "react";
import {FaTimes} from "react-icons/fa";
import {FaList} from "react-icons/fa6";
import {ResponsiveBar} from "@nivo/bar";
import {barTheme} from "@/lib/constants";
import {fetcher} from "@/hooks/FetchDataHook";
import {Button} from "@/components/ui/button";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {createFileRoute} from "@tanstack/react-router";
import {capitalize, changeValueFormat, cn} from "@/lib/utils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/stats/$mediaType/$username")({
    component: StatsPage,
    loader: async ({ params }) => fetcher(`/stats/${params.mediaType}/${params.username}`),
});


const seriesData = (apiData) => {
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
            subtitle: `With ${apiData.lists.countries[0].value} series`,
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
    const networksData = getCategoryData(apiData.lists.networks, "series");
    const actorsData = getCategoryData(apiData.lists.actors, "series");
    const genresData = getCategoryData(apiData.lists.genres, "series");
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
            title: "Kids Shows",
            subtitle: "Cartoon Frenzy",
            topValue: apiData.values.kids,
        },
    ];

    return [
        {label: "Main Statistics", data: <DisplayStats data={mainData}/>},
        {label: "Networks Statistics", data: <DisplayStats data={networksData}/>},
        {label: "Actors Statistics", data: <DisplayStats data={actorsData}/>},
        {label: "Genres Statistics", data: <DisplayStats data={genresData}/>},
        {label: "Misc Statistics", data: <DisplayStats data={miscData}/>},
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
    const directorsData = getCategoryData(apiData.lists.directors, "movies");
    const actorsData = getCategoryData(apiData.lists.actors, "movies");
    const genresData = getCategoryData(apiData.lists.genres, "movies");
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
        {label: "Main Statistics", data: <DisplayStats data={mainData}/>},
        {label: "Directors Statistics", data: <DisplayStats data={directorsData}/>},
        {label: "Actors Statistics", data: <DisplayStats data={actorsData}/>},
        {label: "Genres Statistics", data: <DisplayStats data={genresData}/>},
        {label: "Misc Statistics", data: <DisplayStats data={miscData}/>},
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
    const authorsData = getCategoryData(apiData.lists.authors, "books");
    const publishersData = getCategoryData(apiData.lists.publishers, "books");
    const genresData = getCategoryData(apiData.lists.genres, "books");
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
        {label: "Main Statistics", data: <DisplayStats data={mainData}/>},
        {label: "Authors Statistics", data: <DisplayStats data={authorsData}/>},
        {label: "Publishers Statistics", data: <DisplayStats data={publishersData}/>},
        {label: "Genres Statistics", data: <DisplayStats data={genresData}/>},
        {label: "Misc Statistics", data: <DisplayStats data={miscData}/>},
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
    const developersData = getCategoryData(apiData.lists.developers, "games");
    const publishersData = getCategoryData(apiData.lists.publishers, "games");
    const platformsData = getCategoryData(apiData.lists.platforms, "games");
    const genresData = getCategoryData(apiData.lists.genres, "games");
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
        {label: "Main Statistics", data: <DisplayStats data={mainData}/>},
        {label: "Developers Statistics", data: <DisplayStats data={developersData}/>},
        {label: "Publishers Statistics", data: <DisplayStats data={publishersData}/>},
        {label: "Platforms Statistics", data: <DisplayStats data={platformsData}/>},
        {label: "Genres Statistics", data: <DisplayStats data={genresData}/>},
        {label: "Misc Statistics", data: <DisplayStats data={miscData}/>},
    ];
};

const dataToLoad = (mediaType, apiData) => {
    const mediaData = {
        series: seriesData,
        anime: seriesData,
        movies: moviesData,
        books: booksData,
        games: gamesData,
    };

    return mediaData[mediaType](apiData) || undefined;
};

const getCategoryData = (data, mediaType) => {
    return [
        {title: "Top Watched", subtitle: `With ${data.top_values[0].value} ${mediaType}`, topValue: data.top_values[0].name},
        {title: "Top Rated", subtitle: `With a Rating of ${data.top_rated[0].value}`, topValue: data.top_rated[0].name},
        {title: "Top Favorited", subtitle: `With ${data.top_favorited[0].value} favorites`, topValue: data.top_favorited[0].name},
        {type: "list", title: "Top Watched", list: data.top_values, asGraph: false},
        {type: "list", title: "Top Ratings", list: data.top_rated, asGraph: false},
        {type: "list", title: "Top Favorited", list: data.top_favorited, asGraph: false},
    ];
};


function StatsPage() {
    const apiData = Route.useLoaderData();
    const { mediaType, username } = Route.useParams();
    const [feelingInfo, setFeelingInfo] = useState(true);
    const [tabConfig, _] = useState(dataToLoad(mediaType, apiData));
    const [selectedTab, setSelectedTab] = useState("Main Statistics");

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Stats`} subtitle="Detailed stats for the user">
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <nav className="flex flex-wrap text-muted-foreground justify-center md:flex-col md:gap-3 md:justify-start">
                    {tabConfig.map(tab =>
                        <Button
                            key={tab.label}
                            variant={selectedTab === tab.label ? "secondary" : "ghost"}
                            className="justify-start text-base"
                            onClick={() => handleTabChange(tab.label)}
                        >
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
                    {tabConfig.find(tab => tab.label === selectedTab)?.data}
                </div>
            </div>
        </PageTitle>
    );
}


const DisplayStats = ({ data }) => {
    const listData = data.filter(info => info.type === "list");
    const cardsData = data.filter(info => info.type === undefined);

    return (
        <div>
            <div className={cn("grid gap-4 max-lg:grid-cols-2 max-sm:grid-cols-2 " +
                "max-sm:mt-4", cardsData.length > 3 ? "grid-cols-4" : "grid-cols-3")}>
                {cardsData.map((data, idx) =>
                    <StatsCard
                        key={idx}
                        title={data.title}
                        dataList={data.list}
                        asGraph={data.asGraph}
                        subtitle={data.subtitle}
                        topValue={data.topValue}
                    />
                )}
            </div>
            <div className={cn("grid max-lg:grid-cols-1 max-sm:gap-4 gap-x-6 mt-6", listData.length === 3 ?
                "grid-cols-3" : "grid-cols-2")}>
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
        </div>
    );
};


const StatsCard = ({ title, subtitle, topValue, dataList, asGraph = false }) => {
    return (
        <Card className="flex flex-col lg:min-w-[250px]">
            <CardHeader>
                <CardTitle className="justify-between max-sm:text-base">
                    <div>{title}</div>
                    {dataList &&
                        <Popover>
                            <Tooltip text="Details">
                                <PopoverTrigger>
                                    <FaList className="opacity-50 hover:opacity-100"/>
                                </PopoverTrigger>
                            </Tooltip>
                            <PopoverContent align="end" className={cn("max-h-[500px] overflow-auto",
                                asGraph && "w-[500px] max-sm:w-full")}>
                                {dataList &&
                                    <ListData
                                        title={title}
                                        dataList={dataList}
                                        asGraph={asGraph}
                                    />
                                }
                            </PopoverContent>
                        </Popover>
                    }
                </CardTitle>
                <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center pb-4">
                <div className="text-3xl font-bold line-clamp-1 max-sm:text-xl" title={topValue}>
                    {topValue}
                </div>
            </CardContent>
        </Card>
    );
};


const ListData = ({ title, dataList, asGraph = true }) => {
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
                    borderRadius={4}
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
