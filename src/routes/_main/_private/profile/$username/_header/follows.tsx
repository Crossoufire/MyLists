import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {BlockLink} from "@/lib/client/components/general/BlockLink";
import {followsOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/profile/$username/_header/follows")({
    loader: ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(followsOptions(username))
    },
    component: ProfileFollows,
})


function ProfileFollows() {
    const { username } = Route.useParams();
    const apiData = useSuspenseQuery(followsOptions(username)).data;

    return (
        <PageTitle title="Following">
            <div className="flex justify-start flex-wrap gap-11 mt-3">
                {apiData.follows.map((user) =>
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