import {profileOptions} from "@/api/queryOptions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createFileRoute, Outlet} from "@tanstack/react-router";
import {ProfileHeader} from "@/components/profile/ProfileHeader";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header")({
    component: ProfileTop,
    loader: ({ context: { auth, queryClient }, params: { username } }) => {
        if (!auth.isLoading) {
            return queryClient.ensureQueryData(profileOptions(username));
        }
    },
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
