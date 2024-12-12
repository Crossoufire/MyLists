import {toast} from "sonner";
import {capitalize} from "@/utils/functions";
import {Button} from "@/components/ui/button";
import {Sidebar} from "@/components/app/Sidebar";
import {PageTitle} from "@/components/app/PageTitle";
import {MediaIcon} from "@/components/app/MediaIcon";
import {useAuth} from "@mylists/api/src/useAuthHook";
import {useSuspenseQuery} from "@tanstack/react-query";
import {statsOptions} from "@mylists/api/src/queryOptions";
import {useSimpleMutations} from "@mylists/api/src/useSimpleMutations";
import {createLazyFileRoute, Link} from "@tanstack/react-router";
import {UserComboBox} from "@/components/media-stats/UserComboBox";
import {dataToLoad} from "@/components/media-stats/statsFormatter";
import {StatsDisplay} from "@/components/media-stats/StatsDisplay";
import {Award, CircleHelp, EllipsisVertical, User} from "lucide-react";
import {createContext, useContext, useEffect, useRef, useState} from "react";
import {Popover, PopoverClose, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/stats/$mediaType/$username")({
    component: StatsPage,
});


function StatsPage() {
    const { otherUserStats } = useSimpleMutations();
    const { mediaType, username } = Route.useParams();
    const [otherUser, setOtherUser] = useState("");
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
                <NavigationButtons mediaSettings={apiData.settings}/>
            </div>
            <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[190px_1fr] gap-8 mt-4">
                <Sidebar
                    items={statsData}
                    selectedTab={selectedTab}
                    onTabChange={handleTabChange}
                />
                <div>
                    <RatingProvider value={{ ratingSystem: apiData.stats.rating_system }}>
                        <StatsDisplay
                            statsData={statsData.find(data => data.sidebarTitle === selectedTab)}
                            otherUserStatsData={statsDataOtherUser?.find(data => data.sidebarTitle === selectedTab)}
                        />
                    </RatingProvider>
                </div>
            </div>
        </PageTitle>
    );
}


const NavigationButtons = ({ mediaSettings }) => {
    const popRef = useRef();
    const { mediaType, username } = Route.useParams();

    const closePopover = () => {
        popRef?.current?.click();
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="filters" className="px-2">
                    <EllipsisVertical className="w-4 h-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverClose ref={popRef} className="absolute"/>
            <PopoverContent align="end" className="w-full py-1 px-1 text-sm">
                <Button variant="list" asChild>
                    <Link to={`/profile/${username}`} onClick={closePopover}>
                        <User className="-ml-2 mr-2 w-4 h-4"/> User's profile
                    </Link>
                </Button>
                <Button variant="list" asChild>
                    <Link to={`/achievements/${username}`}>
                        <Award className="-ml-2 mr-2 w-4 h-4"/> Achievements
                    </Link>
                </Button>
                {mediaSettings.map(setting =>
                    <Link
                        onClick={closePopover}
                        key={setting.media_type}
                        disabled={setting.media_type === mediaType}
                        to={`/stats/${setting.media_type}/${username}`}
                    >
                        <Button variant="list" disabled={setting.media_type === mediaType}>
                            <MediaIcon mediaType={setting.media_type} className="-ml-2 mr-2 w-4 h-4"/> {capitalize(setting.media_type)} Stats
                        </Button>
                    </Link>
                )}
            </PopoverContent>
        </Popover>
    );
};


const ComparisonSelector = ({ users, otherUser, addComparison, resetComparison }) => {
    const { currentUser } = useAuth();
    const isConnected = !!currentUser;

    return (
        <div className="flex items-center gap-3">
            <span>Compare with</span>
            <Popover>
                <PopoverTrigger>
                    <CircleHelp className="w-4 h-4"/>
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
                isConnected={isConnected}
                placeholder={"Search user..."}
            />
            {otherUser &&
                <div role="button" className="text-muted-foreground hover:text-neutral-300" onClick={resetComparison}>
                    Clear
                </div>
            }
        </div>
    );
};


const RatingContext = createContext(null);

const RatingProvider = ({ value, children }) => (
    <RatingContext.Provider value={value}>
        {children}
    </RatingContext.Provider>
);

export const useRatingSystem = () => useContext(RatingContext);
