import {followsOptions} from "@/api";
import {BlockLink} from "@/components/app/BlockLink";
import {PageTitle} from "@/components/app/PageTitle";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/follows")({
    loader: ({ context: { queryClient }, params: { username } }) => queryClient.ensureQueryData(followsOptions(username)),
    component: ProfileFollows,
});


function ProfileFollows() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(followsOptions(username)).data;

    return (
        <PageTitle title="Follows">
            <div className="flex justify-start flex-wrap gap-11">
                {apiData.follows.map(user =>
                    <BlockLink key={user.id} to={`/profile/${user.username}`} privacy={user.privacy}>
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
                    </BlockLink>
                )}
            </div>
        </PageTitle>
    );
}
