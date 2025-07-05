import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {MediaLevels} from "@/lib/components/user-profile/MediaLevels";
import {UserUpdates} from "@/lib/components/user-profile/UserUpdates";
import {GlobalStats} from "@/lib/components/user-profile/GlobalStats";
import {MediaDetails} from "@/lib/components/user-profile/MediaDetails";
import {ProfileFollows} from "@/lib/components/user-profile/ProfileFollows";
import {profileOptions} from "@/lib/react-query/query-options/query-options";
import {ProfileMiscInfo} from "@/lib/components/user-profile/ProfileMiscInfo";
import {AchievementsDisplay} from "@/lib/components/user-profile/AchievementProfile";


export const Route = createFileRoute("/_private/profile/$username/_header/")({
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
                    settings={apiData.userData.userMediaSettings}
                />
                <div className="mt-4"/>
                <UserUpdates
                    followers={false}
                    username={username}
                    updates={apiData.userUpdates}
                />
                <div className="mt-4"/>
                <ProfileMiscInfo
                    userData={apiData.userData}
                />
                <div className="mt-4"/>
            </div>
            <div className="col-span-12 md:col-span-8 lg:col-span-6">
                <GlobalStats
                    userData={apiData.userData}
                    global={apiData.mediaGlobalSummary}
                />
                <div className="mt-4"/>
                <MediaDetails
                    userData={apiData.userData}
                    mediaData={apiData.perMediaSummary}
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
                    follows={apiData.userFollows}
                />
                <div className="mt-4"/>
                <UserUpdates
                    followers={true}
                    username={username}
                    updates={apiData.followsUpdates}
                />
            </div>
        </div>
    );
}
