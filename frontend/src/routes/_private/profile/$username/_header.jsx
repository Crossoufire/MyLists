import {fetcher} from "@/lib/fetcherLoader.jsx";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import {ProfileHeader} from "@/components/profile/ProfileHeader";
import {createFileRoute, getRouteApi, Outlet} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header")({
    component: ProfileTop,
    loader: async ({ params }) => fetcher(`/profile/${params.username}`),
});

export const profileHeaderRoute = getRouteApi("/_private/profile/$username/_header");


function ProfileTop() {
    const apiData = Route.useLoaderData();
    const { username } = Route.useParams();

    return (
        <PageTitle title={`${username} Profile`} onlyHelmet>
            <ProfileHeader
                user={apiData.user_data}
                initFollow={apiData.is_following}
                followId={apiData.user_data.id}
            />
            <Outlet/>
        </PageTitle>
    );
}
