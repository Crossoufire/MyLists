import {profileOptions} from "@/api";
import {PageTitle} from "@/components/app/PageTitle";
import {useSuspenseQuery} from "@tanstack/react-query";
import {ProfileHeader} from "@/components/profile/ProfileHeader";
import {createFileRoute, Outlet, redirect} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header")({
    loader: async ({ context: { queryClient }, params: { username } }) => {
        try {
            await queryClient.ensureQueryData(profileOptions(username));
        }
        catch (error) {
            if (error.status === 403) {
                throw redirect({ to: "/", search: { message: "You need to be logged-in to view this profile" } });
            }
        }
    },
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
