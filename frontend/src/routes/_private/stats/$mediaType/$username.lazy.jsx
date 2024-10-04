import {toast} from "sonner";
import {useState} from "react";
import {capitalize} from "@/utils/functions";
import {statsOptions} from "@/api/queryOptions";
import {Sidebar} from "@/components/app/Sidebar";
import {LuHelpCircle, LuX} from "react-icons/lu";
import {PageTitle} from "@/components/app/PageTitle";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createLazyFileRoute} from "@tanstack/react-router";
import {UserComboBox} from "@/components/media-stats/UserComboBox";
import {dataToLoad} from "@/components/media-stats/statsFormatter";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {DisplayStats} from "@/components/media-stats/DisplayStats";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


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
