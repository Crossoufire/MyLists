import {cn, diffColors} from "@/utils/functions";
import {useCollapse} from "@/hooks/CollapseHook";
import {profileOptions} from "@/api/queryOptions";
import {Separator} from "@/components/ui/separator";
import {LuArrowRight, LuAward} from "react-icons/lu";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaLevels} from "@/components/profile/MediaLevels";
import {UserUpdates} from "@/components/profile/UserUpdates";
import {GlobalStats} from "@/components/profile/GlobalStats";
import {MediaDetails} from "@/components/profile/MediaDetails";
import {createLazyFileRoute, Link} from "@tanstack/react-router";
import {ProfileFollows} from "@/components/profile/ProfileFollows";
import {ProfileMiscInfo} from "@/components/profile/ProfileMiscInfo";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/profile/$username/_header/")({
    component: ProfileMain,
});


function ProfileMain() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(profileOptions(username)).data;

    return (
        <div className="grid grid-cols-12 mt-4 mb-5 gap-x-4">
            <div className="col-span-12 md:col-span-4 lg:col-span-3">
                <MediaLevels
                    username={username}
                    mediaLevels={apiData.list_levels}
                />
                <div className="mt-4"/>
                <UserUpdates
                    followers={false}
                    username={username}
                    updates={apiData.user_updates}
                />
                <div className="mt-4"/>
                <ProfileMiscInfo
                    user={apiData.user_data}
                    mediaData={apiData.list_levels}
                />
                <div className="mt-4"/>
            </div>
            <div className="col-span-12 md:col-span-8 lg:col-span-6">
                <GlobalStats
                    userData={apiData.user_data}
                    global={apiData.media_global}
                />
                <div className="mt-4"/>
                <MediaDetails
                    userData={apiData.user_data}
                    mediaData={apiData.media_data}
                />
                <div className="mt-4"/>
                <AchievementsDisplay
                    username={username}
                    achievements={apiData.achievements}
                />
                <div className="mt-4"/>
            </div>
            <div className="col-span-12 md:col-span-12 lg:col-span-3">
                <ProfileFollows
                    username={username}
                    follows={apiData.follows}
                />
                <div className="mt-4"/>
                <UserUpdates
                    followers={true}
                    username={username}
                    updates={apiData.follows_updates}
                />
            </div>
        </div>
    );
}


function AchievementsDisplay({ username, achievements: { summary, details } }) {
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="py-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>Achievements</div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className={contentClasses}>
                <AchievementSummary
                    summary={summary}
                />
                <div className="grid grid-cols-3 gap-4">
                    {details.map((ach, idx) => (
                        <div key={idx} className="bg-gray-800 p-3 rounded-md">
                            <div className="flex items-center gap-1">
                                <LuAward className={cn("w-5 h-5", diffColors(ach.difficulty.toLowerCase()))}/>
                                <div className="text-sm font-semibold truncate w-full">
                                    {ach.name}
                                </div>
                            </div>
                            <div className="text-xs line-clamp-2 text-muted-foreground">
                                {ach.description}
                            </div>
                        </div>
                    ))}
                </div>
                <Separator className="mt-3"/>
                <div className="flex items-center justify-end">
                    <Link to={`/achievements/${username}`} className="font-medium hover:underline">
                        All achievements<LuArrowRight className="inline-block ml-1"/>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}


function AchievementSummary({ summary }) {
    const total = summary.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="flex items-center justify-between font-bold mb-4">
            <div className="flex items-center font-bold gap-4">
                {summary.map((diff, idx) =>
                    <div key={idx} className="flex items-center gap-1">
                        <LuAward className={cn("w-5 h-5", diffColors(diff.difficulty.toLowerCase()))}/>
                        <span>{diff.count}</span>
                    </div>
                )}
            </div>
            <div>Total: {total}/52</div>
        </div>
    );
}
