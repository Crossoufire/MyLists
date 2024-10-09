import {toast} from "sonner";
import {capitalize} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import {statsOptions} from "@/api/queryOptions";
import {Sidebar} from "@/components/app/Sidebar";
import {useEffect, useRef, useState} from "react";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaIcon} from "@/components/app/MediaIcon";
import {DotsVerticalIcon} from "@radix-ui/react-icons";
import {useSuspenseQuery} from "@tanstack/react-query";
import {LuHelpCircle, LuUser, LuX} from "react-icons/lu";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {createLazyFileRoute, Link} from "@tanstack/react-router";
import {UserComboBox} from "@/components/media-stats/UserComboBox";
import {dataToLoad} from "@/components/media-stats/statsFormatter";
import {StatsDisplay} from "@/components/media-stats/StatsDisplay";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


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

    useEffect(() => {
        resetComparison();
    }, [mediaType, username]);

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
            <div className="flex items-center justify-between gap-3 my-4 max-sm:justify-center">
                <ComparisonSelector
                    users={apiData.users}
                    otherUser={otherUser}
                    addComparison={addComparison}
                    resetComparison={resetComparison}
                />
                <NavigationButtons settings={apiData.settings}/>
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
                    <StatsDisplay
                        statsData={statsData.find(data => data.sidebarTitle === selectedTab)}
                        otherUserStatsData={statsDataOtherUser?.find(data => data.sidebarTitle === selectedTab)}
                    />
                </div>
            </div>
        </PageTitle>
    );
}


const NavigationButtons = ({ settings }) => {
    const popRef = useRef();
    const { mediaType, username } = Route.useParams();

    const closePopover = () => {
        popRef?.current?.click();
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="filters" className="px-2">
                    <DotsVerticalIcon/>
                </Button>
            </PopoverTrigger>
            <PopoverClose ref={popRef} className="absolute"/>
            <PopoverContent align="end" className="w-full py-1 px-1 text-sm">
                <Button variant="list" asChild>
                    <Link to={`/profile/${username}`} onClick={closePopover}>
                        <LuUser className="-ml-2 mr-2"/> User's profile
                    </Link>
                </Button>
                {settings.map(setting =>
                    <Link
                        key={setting.media_type}
                        to={`/stats/${setting.media_type}/${username}`}
                        disabled={setting.media_type === mediaType}
                        onClick={closePopover}
                        asChild
                    >
                        <Button variant="list" disabled={setting.media_type === mediaType}>
                            <MediaIcon mediaType={setting.media_type} className="-ml-2 mr-2"/> {capitalize(setting.media_type)} Stats
                        </Button>
                    </Link>
                )}
            </PopoverContent>
        </Popover>
    );
};


const ComparisonSelector = ({ users, otherUser, addComparison, resetComparison }) => {
    return (
        <div className="flex items-center gap-3">
            <span>Compare with</span>
            <Popover>
                <PopoverTrigger>
                    <LuHelpCircle/>
                </PopoverTrigger>
                <PopoverContent align="start">
                    Comparison between users is only based on card statistics, excluding tables and
                    graphs.
                </PopoverContent>
            </Popover>
            <UserComboBox
                dataList={users}
                resetValue={otherUser}
                callback={addComparison}
                placeholder="Search user..."
            />
            {otherUser &&
                <div role="button" className="text-muted-foreground hover:text-neutral-300" onClick={resetComparison}>
                    Clear
                </div>
            }
        </div>
    );
};
