import {profileOptions} from "@/api";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {MediaLevels} from "@/components/profile/MediaLevels";
import {UserUpdates} from "@/components/profile/UserUpdates";
import {GlobalStats} from "@/components/profile/GlobalStats";
import {MediaDetails} from "@/components/profile/MediaDetails";
import {ProfileFollows} from "@/components/profile/ProfileFollows";
import {ProfileMiscInfo} from "@/components/profile/ProfileMiscInfo";
import {AchievementsDisplay} from "@/components/profile/AchievementProfile";


// noinspection JSCheckFunctionSignatures
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
                    userData={apiData.user_data}
                />
                <div className="mt-4"/>
                <UserUpdates
                    followers={false}
                    username={username}
                    updates={apiData.user_updates}
                />
                <div className="mt-4"/>
                <ProfileMiscInfo
                    userData={apiData.user_data}
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
