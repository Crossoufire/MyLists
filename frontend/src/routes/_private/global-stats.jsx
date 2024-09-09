import {Fragment} from "react";
import {ResponsiveBar} from "@nivo/bar";
import {FaQuestionCircle} from "react-icons/fa";
import {Separator} from "@/components/ui/separator";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/components/app/base/PageTitle";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {formatNumberWithSpaces, getMediaColor, globalStatsTimeFormat} from "@/utils/functions.jsx";
import {queryOptionsMap} from "@/api/queryOptions.js";
import {barTheme} from "@/utils/nivoThemes.js";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/global-stats")({
    component: GlobalStatsPage,
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(queryOptionsMap.globalStats()),
});


function GlobalStatsPage() {
    const apiData = useSuspenseQuery(queryOptionsMap.globalStats()).data;

    const graphData = [
        {id: "Series", value: apiData.total_time.series, color: getMediaColor("series")},
        {id: "Anime", value: apiData.total_time.anime, color: getMediaColor("anime")},
        {id: "Movies", value: apiData.total_time.movies, color: getMediaColor("movies")},
        {id: "Books", value: apiData.total_time.books, color: getMediaColor("books")},
        {id: "Games", value: apiData.total_time.games, color: getMediaColor("games")},
    ];

    const mediaData = [
        {name: "Series",mediaType: "series", count: apiData.nb_media.series},
        {name: "Anime", mediaType: "anime", count: apiData.nb_media.anime},
        {name: "Movies",mediaType: "movies", count: apiData.nb_media.movies},
        {name: "Books", mediaType: "books", count: apiData.nb_media.books},
        {name: "Games", mediaType: "games", count: apiData.nb_media.games},
        {name: "Users", mediaType: "user", count: apiData.nb_users}
    ];

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
                            <div className="text-center text-lg font-semibold">Total Time Per Media</div>
                            <div className="flex items-center h-[300px]">
                                <ResponsiveBar
                                    padding={0.35}
                                    theme={barTheme}
                                    data={graphData}
                                    borderRadius={4}
                                    labelSkipHeight={21}
                                    isInteractive={false}
                                    colors={{ datum: "data.color" }}
                                    axisLeft={{ format: (value) => value / 1000 + "k" }}
                                    margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
                                    valueFormat={(data) => formatNumberWithSpaces(data) + " h"}
                                />
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


const GlobalTopMediaItem = ({ title, dataToMap, asFloat = false, help = null }) => {
    return (
        <div className="bg-card p-3 rounded-md">
            {title &&
                <div>
                    <div className="flex justify-left gap-3 items-center">
                        <div className="text-base font-medium">{title}</div>
                        {help &&
                            <Popover>
                                <PopoverTrigger className="opacity-30 hover:opacity-80">
                                    <FaQuestionCircle size={15}/>
                                </PopoverTrigger>
                                <PopoverContent>
                                    {help}
                                </PopoverContent>
                            </Popover>
                        }
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
