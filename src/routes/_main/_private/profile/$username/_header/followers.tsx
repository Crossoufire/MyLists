import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {BlockLink} from "@/lib/client/components/general/BlockLink";
import {followersOptions} from "@/lib/client/react-query/query-options/query-options";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";


export const Route = createFileRoute("/_main/_private/profile/$username/_header/followers")({
    loader: ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(followersOptions(username))
    },
    component: ProfileFollowers,
})


function ProfileFollowers() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(followersOptions(username)).data;

    return (
        <PageTitle title="Followers">
            <div className="flex justify-start flex-wrap gap-11 mt-3">
                {apiData.followers.map(user =>
                    <BlockLink
                        key={user.id}
                        privacy={user.privacy}
                        to={"/profile/$username"}
                        params={{ username: user.username }}
                    >
                        <div className="flex items-center flex-col">
                            <ProfileIcon
                                fallbackSize="text-2xl"
                                className="size-20 border-2"
                                user={{ image: user.image, name: user.username }}
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