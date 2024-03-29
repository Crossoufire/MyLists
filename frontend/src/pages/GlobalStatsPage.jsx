import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {capitalize, changeValueFormat} from "@/lib/utils";
import {MediaIcon} from "@/components/primitives/MediaIcon";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {GlobalTopMediaItem} from "@/components/myListsStats/GlobalTopMediaItem";
import {Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis} from "recharts";


export const GlobalStatsPage = () => {
    const { apiData, loading, error } = useFetchData("/mylists_stats");

    if (error) return <ErrorPage {...error}/>;
    if (loading) return <Loading/>;

    const graphData = [
        {label: "Series", value: apiData.total_time.series, color: "#216e7d"},
        {label: "Anime", value: apiData.total_time.anime, color: "#945141"},
        {label: "Movies", value: apiData.total_time.movies, color: "#8c7821"},
        {label: "Books", value: apiData.total_time.books, color: "#584c6e"},
        {label: "Games", value: apiData.total_time.games, color: "#196219"},
    ]

    const mediaData = [
        {name: "series", count: apiData.nb_media.series},
        {name: "anime", count: apiData.nb_media.anime},
        {name: "movies", count: apiData.nb_media.movies},
        {name: "books", count: apiData.nb_media.books},
        {name: "games", count: apiData.nb_media.games},
        {name: "user", count: apiData.nb_users}
    ];

    return (
        <PageTitle title="Global Statistics" subtitle="The global statistics of all the users using MyLists.info">
            <div className="flex flex-col gap-4 mt-4 mx-auto max-w-[1150px]">
                <div className="font-medium text-center py-6 rounded-md bg-card max-sm:text-2xl text-5xl">
                    {apiData.total_time.total}
                </div>
                <div className="grid grid-cols-12 justify-center items-center gap-4">
                    {mediaData.map((media, idx) =>
                        <div key={idx} className="col-span-6 md:col-span-4 lg:col-span-2">
                            <div className="flex flex-col justify-center items-center rounded-md p-2 bg-card">
                                <MediaIcon mediaType={media.name} size={25}/>
                                <div className="text-lg font-medium mt-2">{media.count} {capitalize(media.name)}</div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-3 lg:col-span-3">
                        <div className="flex flex-col gap-4 justify-between h-full">
                            <div className="text-center rounded-md p-2 font-medium bg-card">
                                <div className="text-base">SERIES</div>
                                <Separator className="mt-1 mb-1"/>
                                <div>{changeValueFormat(apiData.total_seasons.series[0].seasons)} seasons</div>
                                <div>{changeValueFormat(apiData.total_seasons.series[0].episodes)} episodes</div>
                            </div>
                            <div className="text-center rounded-md p-2 font-medium bg-card">
                                <div className="text-base">ANIME</div>
                                <Separator className="mt-1 mb-1"/>
                                <div>{changeValueFormat(apiData.total_seasons.anime[0].seasons)} seasons</div>
                                <div>{changeValueFormat(apiData.total_seasons.anime[0].episodes)} episodes</div>
                            </div>
                            <div className="text-center rounded-md p-2 font-medium bg-card">
                                <div className="text-base">BOOKS</div>
                                <Separator className="mt-1 mb-1"/>
                                <div>{changeValueFormat(apiData.total_pages)} pages</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-9 lg:col-span-9">
                        <div className="p-2 rounded-md bg-card">
                            <div className="text-center text-lg">Total time per media (in hours)</div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={graphData} margin={{left: 0}}>
                                    <XAxis
                                        dataKey="label"
                                        axisLine={{stroke: "#cccccc"}}
                                        tick={{fill: "#cccccc", fontWeight: 500}}
                                    />
                                    <YAxis
                                        axisLine={{stroke: "#cccccc"}}
                                        tick={{fill: "#cccccc", fontWeight: 500}}
                                        tickFormatter={(value) => value / 1000 + " k"}
                                    />
                                    <Bar dataKey="value" barSize={85} radius={[6, 6, 0, 0]}>
                                        <LabelList
                                            dataKey="value"
                                            position="insideTop"
                                            fill="#cccccc"
                                            fontWeight={500}
                                            formatter={(value) => changeValueFormat(value, "h")}
                                        />
                                        {graphData.map((val, idx) =>
                                            <Cell key={`cell-${idx}`} fill={val.color}/>
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <Tabs defaultValue="series">
                    <TabsList className="grid w-full grid-cols-5 mb-5 h-12">
                        <TabsTrigger value="series" className="text-lg">Series</TabsTrigger>
                        <TabsTrigger value="anime" className="text-lg">Anime</TabsTrigger>
                        <TabsTrigger value="movies" className="text-lg">Movies</TabsTrigger>
                        <TabsTrigger value="books" className="text-lg">Books</TabsTrigger>
                        <TabsTrigger value="games" className="text-lg">Games</TabsTrigger>
                    </TabsList>
                    <TabsContent value="series">
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Completed"
                                    dataToMap={apiData.top_media.series}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Genres"
                                    dataToMap={apiData.top_genres.series}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Actors"
                                    dataToMap={apiData.top_actors.series}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Dropped"
                                    dataToMap={apiData.top_dropped.series}
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="anime">
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Completed"
                                    dataToMap={apiData.top_media.anime}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Genres"
                                    dataToMap={apiData.top_genres.anime}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Actors"
                                    dataToMap={apiData.top_actors.anime}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Dropped"
                                    dataToMap={apiData.top_dropped.anime}
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="movies">
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Completed"
                                    dataToMap={apiData.top_media.movies}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Genres"
                                    dataToMap={apiData.top_genres.movies}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Actors"
                                    dataToMap={apiData.top_actors.movies}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Top Directors"
                                    dataToMap={apiData.top_directors.movies}
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="books">
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-12 md:col-span-4 lg:col-span-4">
                                <GlobalTopMediaItem
                                    title="Top Completed"
                                    dataToMap={apiData.top_media.books}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4 lg:col-span-4">
                                <GlobalTopMediaItem
                                    title="Top Genres"
                                    dataToMap={apiData.top_genres.books}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4 lg:col-span-4">
                                <GlobalTopMediaItem
                                    title="Top Authors"
                                    dataToMap={apiData.top_authors.books}
                                />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="games">
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-12 md:col-span-4 lg:col-span-4">
                                <GlobalTopMediaItem
                                    title="Top Played"
                                    dataToMap={apiData.top_media.games}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4 lg:col-span-4">
                                <GlobalTopMediaItem
                                    title="Top Genres"
                                    dataToMap={apiData.top_genres.games}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-4 lg:col-span-4">
                                <GlobalTopMediaItem
                                    title="Top Developers"
                                    dataToMap={apiData.top_developers.games}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </PageTitle>
    );
};
