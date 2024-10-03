import {toast} from "sonner";
import {useState} from "react";
import {ResponsiveBar} from "@nivo/bar";
import {barTheme} from "@/utils/nivoThemes";
import {statsOptions} from "@/api/queryOptions";
import {Tooltip} from "@/components/ui/tooltip";
import {capitalize, cn} from "@/utils/functions";
import {Sidebar} from "@/components/app/Sidebar";
import {Separator} from "@/components/ui/separator";
import {useSuspenseQuery} from "@tanstack/react-query";
import {LuHelpCircle, LuList, LuX} from "react-icons/lu";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createLazyFileRoute} from "@tanstack/react-router";
import {UserComboBox} from "@/components/app/UserComboBox";
import {dataToLoad} from "@/components/mediaStats/statsData";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/stats/$mediaType/$username")({
    component: StatsPage,
});


function StatsPage() {
    const { otherUserStats } = simpleMutations();
    const { mediaType, username } = Route.useParams();
    const [otherUser, setOtherUser] = useState("");
    const [feelingInfo, setFeelingInfo] = useState(true);
    const [statsDataOtherUser, setStatsDataOtherUser] = useState([]);
    const [selectedTab, handleTabChange] = useState("Main Statistics");
    const apiData = useSuspenseQuery(statsOptions(mediaType, username)).data;
    const statsData = dataToLoad(mediaType, apiData.stats);

    const addComparison = async (username) => {
        otherUserStats.mutate({ mediaType, username }, {
            onError: () => toast.error("An error occurred while fetching the other user stats"),
            onSuccess: async (data) => {
                setStatsDataOtherUser(dataToLoad(mediaType, data.stats));
                setOtherUser(username);
            },
        });
    };

    const resetComparison = () => {
        setOtherUser("");
        setStatsDataOtherUser([]);
    };

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Stats`} subtitle="Detailed stats for the user">
            <div className="flex items-center gap-3 my-4 max-sm:justify-center">
                {apiData.is_current &&
                    <>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger>
                                    <LuHelpCircle/>
                                </PopoverTrigger>
                                <PopoverContent align="start">
                                    Comparison between users is only based on card statistics, excluding tables and
                                    graphs.
                                </PopoverContent>
                            </Popover>
                            <span>Compare with</span>
                        </div>
                        <UserComboBox
                            resetValue={otherUser}
                            dataList={apiData.users}
                            callback={addComparison}
                            placeholder="Search user..."
                        />
                        {otherUser &&
                            <div role="button" className="text-muted-foreground hover:text-neutral-300" onClick={resetComparison}>
                                Clear
                            </div>
                        }
                    </>
                }
            </div>
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <Sidebar
                    items={statsData}
                    selectedTab={selectedTab}
                    onTabChange={handleTabChange}
                />
                <div>
                    {(apiData.is_feeling && feelingInfo) &&
                        <div className="mb-4 p-3 bg-cyan-900/80 rounded-md">
                            <div role="button" className="relative" onClick={() => setFeelingInfo(false)}>
                                <LuX className="absolute right-0 opacity-80"/>
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
        <Card className="flex flex-col lg:min-w-[220px]">
            <CardHeader>
                <CardTitle className="justify-between max-sm:text-base">
                    <div>{data.title}</div>
                    {(data.data && !otherData) &&
                        <Popover>
                            <Tooltip text="Details">
                                <PopoverTrigger>
                                    <LuList className="opacity-50 hover:opacity-100"/>
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
                            {typeof otherData.value === "number" || otherData.title === "Total Budgets" ||
                            otherData.title === "Total Revenue" ?
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
