import {followersOptions} from "@/api/queryOptions";
import {BlockLink} from "@/components/app/BlockLink";
import {PageTitle} from "@/components/app/PageTitle";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createLazyFileRoute} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/profile/$username/_header/followers")({
    component: ProfileFollowers,
});


function ProfileFollowers() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(followersOptions(username)).data;

    return (
        <PageTitle title="Followers">
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
