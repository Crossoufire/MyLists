import {fetcher} from "@/lib/fetcherLoader";
import {Return} from "@/components/app/base/Return";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createFileRoute, Link} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/follows")({
    component: ProfileFollows,
    loader: async ({ params }) => fetcher(`/user/${params.username}/following`),
});


function ProfileFollows() {
    const apiData = Route.useLoaderData();
    const {username} = Route.useParams();

    return (
        <PageTitle title="Followers">
            <Return className="mb-6"
                    to={`/profile/${username}`}
                    value="to profile"
            />
            <div className="grid grid-cols-12 gap-4 gap-y-10">
                {apiData.map(user =>
                    <div key={user.id} className="col-span-2 max-sm:col-span-6 max-md:col-span-3 items-center">
                        <Link to={`/profile/${user.username}`}>
                            <div className="flex items-center flex-col">
                                <img
                                    src={user.profile_cover}
                                    className="h-20 w-20 bg-neutral-600 rounded-full"
                                    alt="profile-picture"
                                />
                                <div className="mt-2 font-medium">
                                    {user.username}
                                </div>
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </PageTitle>
    );
}
