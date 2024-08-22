import {userClient} from "@/api/MyApiClient";
import {createFileRoute} from "@tanstack/react-router";
import {UpdatesModal} from "@/components/app/UpdatesModal";
import {MediaLevels} from "@/components/profile/MediaLevels";
import {UserUpdates} from "@/components/profile/UserUpdates";
import {GlobalStats} from "@/components/profile/GlobalStats";
import {MediaDetails} from "@/components/profile/MediaDetails";
import {ProfileFollows} from "@/components/profile/ProfileFollows";
import {ProfileViewsInfo} from "@/components/profile/ProfileViewsInfo";
import {profileHeaderRoute} from "@/routes/_private/profile/$username/_header.jsx";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/")({
    component: ProfileMain,
});


function ProfileMain() {
    const apiData = profileHeaderRoute.useLoaderData();
    console.log(apiData);

    return (
        <div className="grid grid-cols-12 mt-4 mb-5 gap-x-4">
            <div className="col-span-12 md:col-span-4 lg:col-span-3">
                <MediaLevels mediaLevels={apiData.media_stats}/>
                <div className="mt-4"/>
                <UserUpdates
                    followers={false}
                    updates={apiData.user_updates}
                />
                <div className="mt-4"/>
                <ProfileViewsInfo userData={apiData.user_data}/>
                <div className="mt-4"/>
            </div>
            <div className="col-span-12 md:col-span-8 lg:col-span-6">
                <GlobalStats
                    userData={apiData.user_data}
                    globalStats={apiData.global_stats}
                />
                <div className="mt-4"/>
                <MediaDetails
                    userData={apiData.user_data}
                    mediaData={apiData.media_stats}
                />
                <div className="mt-4"/>
            </div>
            <div className="col-span-12 md:col-span-12 lg:col-span-3">
                <ProfileFollows follows={apiData.follows}/>
                <div className="mt-4"/>
                <UserUpdates
                    followers={true}
                    updates={apiData.follows_updates}
                />
            </div>
            {(userClient.currentUser.id === apiData.user_data.id) &&
                <UpdatesModal userData={apiData.user_data}/>
            }
        </div>
    );
}
