import {fetcher} from "@/lib/fetcherLoader";
import {Return} from "@/components/app/base/Return";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createFileRoute, Link} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/followers")({
    component: ProfileFollowers,
    loader: async ({ params }) => fetcher(`/profile/${params.username}/followers`),
});


function ProfileFollowers() {
    const apiData = Route.useLoaderData();
    const { username } = Route.useParams();

    return (
        <PageTitle title="Followers">
            <Return className="mb-6"
                to={`/profile/${username}`}
                value="to profile"
            />
            <div className="flex justify-start flex-wrap gap-11">
                {apiData.follows.map(user =>
                    <Link key={user.id} to={`/profile/${user.username}`}>
                        <div className="flex items-center flex-col">
                            <img
                                src={user.profile_image}
                                className="h-20 w-20 bg-neutral-600 rounded-full"
                                alt="profile-picture"
                            />
                            <div className="mt-2 font-medium">
                                {user.username}
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </PageTitle>
    )
}
