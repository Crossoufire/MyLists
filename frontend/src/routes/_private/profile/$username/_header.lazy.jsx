import {profileOptions} from "@/api/queryOptions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/components/app/base/PageTitle";
import {ProfileHeader} from "@/components/profile/ProfileHeader";
import {createLazyFileRoute, Outlet} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/profile/$username/_header")({
    component: ProfileTop,
});


function ProfileTop() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(profileOptions(username)).data;

    return (
        <PageTitle title={`${username} Profile`} onlyHelmet>
            <ProfileHeader
                user={apiData.user_data}
                followId={apiData.user_data.id}
                followStatus={apiData.is_following}
            />
            <Outlet/>
        </PageTitle>
    );
}
