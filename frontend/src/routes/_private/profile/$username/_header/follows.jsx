import {followsOptions} from "@/api/queryOptions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createFileRoute, Link} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/follows")({
    component: ProfileFollows,
    loader: ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(followsOptions(username));
    },
});


function ProfileFollows() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(followsOptions(username)).data;

    return (
        <PageTitle title="Follows">
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
    );
}
