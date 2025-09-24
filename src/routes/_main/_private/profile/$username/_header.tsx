import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {createFileRoute, Outlet} from "@tanstack/react-router";
import {ProfileHeader} from "@/lib/client/components/user-profile/ProfileHeader";
import {profileOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/profile/$username/_header")({
    loader: async ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(profileOptions(username));
    },
    component: ProfileTop,
});


function ProfileTop() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(profileOptions(username)).data;

    return (
        <PageTitle title={`${username} Profile`} onlyHelmet>
            <ProfileHeader
                user={apiData.userData}
                followId={apiData.userData.id}
                followStatus={apiData.isFollowing}
            />
            <Outlet/>
        </PageTitle>
    );
}
