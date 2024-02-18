import {UserUpdates} from "@/components/profile/UserUpdates";
import {GlobalStats} from "@/components/profile/GlobalStats";
import {MediaLevels} from "@/components/profile/MediaLevels";
import {MediaDetails} from "@/components/profile/MediaDetails";
import {ProfileFollows} from "@/components/profile/ProfileFollows";
import {ProfileMiscInfo} from "@/components/profile/ProfileMiscInfo";



export const ProfileData = ({ username, apiData }) => {
    return (
        <div className="grid grid-cols-12 mt-4 mb-5 gap-x-4">
            <div className="col-span-12 md:col-span-4 lg:col-span-3">
                <MediaLevels
                    username={username}
                    mediaLevels={apiData.list_levels}
                />
                <div className="mt-4"/>
                <UserUpdates
                    username={username}
                    updates={apiData.user_updates}
                    followers={false}
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
            </div>
            <div className="col-span-12 md:col-span-12 lg:col-span-3">
                <ProfileFollows
                    username={username}
                    follows={apiData.follows}
                />
                <div className="mt-4"/>
                <UserUpdates
                    username={username}
                    updates={apiData.follows_updates}
                    followers={true}
                />
            </div>
        </div>
    );
}
