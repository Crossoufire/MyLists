import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {BlockLink} from "@/lib/components/app/BlockLink";
import {followersOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_private/profile/$username/_header/followers")({
    loader: ({ context: { queryClient }, params: { username } }) =>
        queryClient.ensureQueryData(followersOptions(username)),
    component: ProfileFollowers,
})


function ProfileFollowers() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(followersOptions(username)).data;

    return (
        <PageTitle title="Followers">
            <div className="flex justify-start flex-wrap gap-11">
                {apiData.followers.map(user =>
                    <BlockLink
                        key={user.id}
                        privacy={user.privacy}
                        to={"/profile/$username"}
                        params={{ username: user.username }}
                    >
                        <div className="flex items-center flex-col">
                            <img
                                src={user.image!}
                                alt="profile-picture"
                                className="h-20 w-20 bg-neutral-600 rounded-full"
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