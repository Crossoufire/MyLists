import {Fragment} from "react";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaIcon} from "@/components/app/MediaIcon";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createLazyFileRoute} from "@tanstack/react-router";
import {globalStatsOptions} from "@mylists/api/src/queryOptions";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis} from "recharts";
import {formatNumberWithSpaces, getMediaColor, globalStatsTimeFormat} from "@/utils/functions";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/global-stats")({
    component: GlobalStatsPage,
});


function GlobalStatsPage() {
    const apiData = useSuspenseQuery(globalStatsOptions()).data;

    const graphData = [
        { label: "Series", value: apiData.total_time.series[0], color: getMediaColor("series") },
        { label: "Anime", value: apiData.total_time.anime[0], color: getMediaColor("anime") },
        { label: "Movies", value: apiData.total_time.movies[0], color: getMediaColor("movies") },
        { label: "Books", value: apiData.total_time.books[0], color: getMediaColor("books") },
        { label: "Games", value: apiData.total_time.games[0], color: getMediaColor("games") },
    ];
    const mediaData = [
        { name: "Series", mediaType: "series", count: apiData.nb_media.series },
        { name: "Anime", mediaType: "anime", count: apiData.nb_media.anime },
        { name: "Movies", mediaType: "movies", count: apiData.nb_media.movies },
        { name: "Books", mediaType: "books", count: apiData.nb_media.books },
        { name: "Games", mediaType: "games", count: apiData.nb_media.games },
        { name: "Users", mediaType: "user", count: apiData.nb_users }
    ];

    const renderCustomLabel = ({ x, y, width, height, value }) => {
        if (height < 17) return null;

        const X = x + width / 2;
        const Y = y + height / 2;

        return (
            <text x={X} y={Y} fontWeight={500} textAnchor="middle" dominantBaseline="central" fontSize={height < 20 ? 14 : 16}>
                {(value / 24 / 365).toFixed(1)}y
            </text>
        );
    };

    return (
        <PageTitle title="Global Statistics" subtitle="The global statistics of all the users using MyLists.info">
            <div className="flex flex-col gap-4 mt-4 mx-auto max-w-[1000px]">
                <div className="font-medium text-center py-6 rounded-md bg-card max-sm:text-2xl text-5xl">
                    {globalStatsTimeFormat(apiData.total_time.total)}
                </div>
                <div className="grid grid-cols-12 justify-center items-center gap-4">
                    {mediaData.map(media =>
                        <div key={media.mediaType} className="col-span-6 md:col-span-4 lg:col-span-2">
                            <div className="flex flex-col justify-center items-center rounded-md p-2 bg-card">
                                <MediaIcon mediaType={media.mediaType} size={25}/>
                                <div className="text-lg font-medium mt-2">
                                    {media.count} {media.name}
                                </div>
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
                                <div>{formatNumberWithSpaces(apiData.total_seasons.series[0].seasons)} seasons</div>
                                <div>{formatNumberWithSpaces(apiData.total_seasons.series[0].episodes)} episodes</div>
                            </div>
                            <div className="text-center rounded-md p-2 font-medium bg-card">
                                <div className="text-base">ANIME</div>
                                <Separator className="mt-1 mb-1"/>
                                <div>{formatNumberWithSpaces(apiData.total_seasons.anime[0].seasons)} seasons</div>
                                <div>{formatNumberWithSpaces(apiData.total_seasons.anime[0].episodes)} episodes</div>
                            </div>
                            <div className="text-center rounded-md p-2 font-medium bg-card">
                                <div className="text-base">BOOKS</div>
                                <Separator className="mt-1 mb-1"/>
                                <div>{formatNumberWithSpaces(apiData.total_pages)} pages</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-9 lg:col-span-9">
                        <div className="p-2 rounded-md bg-card">
                            <div className="text-center text-lg font-semibold">Total Hours Spent Per Media Type</div>
                            <div className="flex items-center justify-center h-[300px] max-sm:h-[200px]">
                                <ResponsiveContainer>
                                    <BarChart data={graphData} margin={{ top: 8, right: 5, left: -12, bottom: 0 }}>
                                        <XAxis dataKey="label" stroke="#e2e2e2"/>
                                        <YAxis stroke="#e2e2e2" tickFormatter={(v) => v / 1000} unit="k"/>
                                        <Bar dataKey="value">
                                            {graphData.map((entry, idx) => (<Cell key={idx} fill={entry.color}/>))}
                                            <LabelList dataKey="value" position="center" content={renderCustomLabel}/>
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
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
                                    title="Most Completed"
                                    dataToMap={apiData.top_media.movies}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Most Added Genres"
                                    dataToMap={apiData.top_genres.movies}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Most Added Actors"
                                    dataToMap={apiData.top_actors.movies}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-6 lg:col-span-3">
                                <GlobalTopMediaItem
                                    title="Most Added Directors"
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
}


const GlobalTopMediaItem = ({ title, dataToMap, asFloat = false }) => {
    return (
        <div className="bg-card p-3 rounded-md">
            {title &&
                <div>
                    <div className="flex justify-left gap-3 items-center">
                        <div className="text-base font-medium">{title}</div>
                    </div>
                    <Separator/>
                </div>
            }
            <div className="grid grid-cols-12 gap-y-3">
                {dataToMap.map(media =>
                    <Fragment key={media.info}>
                        <div className="col-span-3">
                            <div className="text-center">
                                {asFloat ? media.quantity.toFixed(3) : media.quantity}
                            </div>
                        </div>
                        <div className="col-span-9">
                            <div className="line-clamp-1" title={media.info}>
                                {media.info}
                            </div>
                        </div>
                    </Fragment>
                )}
            </div>
        </div>
    );
};
