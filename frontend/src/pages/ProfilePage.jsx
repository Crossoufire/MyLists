import {useParams} from "react-router-dom";
import {ErrorPage} from "@/pages/ErrorPage";
import {useFetchData} from "@/hooks/FetchDataHook";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {AllUpdates} from "@/components/profile/AllUpdates";
import {ProfileData} from "@/components/profile/ProfileData";
import {ProfileHeader} from "@/components/profile/ProfileHeader";
import {FollowsFollowers} from "@/components/profile/FollowsFollowers";


const componentToLoad = (extension) => {
    const components = {
        history: AllUpdates,
        follows: FollowsFollowers,
        followers: FollowsFollowers,
        undefined: ProfileData,
        default: ErrorPage,
    };

    return components[extension] || components.default;
};


export const ProfilePage = () => {
    const { username, extension } = useParams();
    const { apiData, loading, error } = useFetchData(`/profile/${username}`)

    if (error) return <ErrorPage error={error}/>;
    if (loading) return <Loading/>;

    const ProfileComponent = componentToLoad(extension);

    return (
        <PageTitle title={`${username} Profile`} onlyHelmet>
            <ProfileHeader
                user={apiData.user_data}
                initFollow={apiData.is_following}
                followId={apiData.user_data.id}
            />
            <ProfileComponent
                username={username}
                extension={extension}
                apiData={apiData}
            />
        </PageTitle>
    );
};
