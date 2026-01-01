import {toast} from "sonner";
import {PrivacyIcon} from "@/lib/utils/functions";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {UserCheck, UserPlus, UserX} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {BlockLink} from "@/lib/client/components/general/BlockLink";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {followsOptions} from "@/lib/client/react-query/query-options/query-options";
import {useFollowMutation} from "@/lib/client/react-query/query-mutations/user.mutations";


export const Route = createFileRoute("/_main/_private/profile/$username/_header/follows")({
    loader: ({ context: { queryClient }, params: { username } }) => {
        return queryClient.ensureQueryData(followsOptions(username))
    },
    component: ProfileFollows,
})


function ProfileFollows() {
    const { currentUser } = useAuth();
    const { username: profileOwner } = Route.useParams();
    const isViewingOwnProfile = currentUser?.name === profileOwner;
    const updateFollowMutation = useFollowMutation(profileOwner, false);
    const apiData = useSuspenseQuery(followsOptions(profileOwner)).data;

    const handleFollow = (followId: number, followStatus: boolean) => {
        updateFollowMutation.mutate({ data: { followId, followStatus: !followStatus } }, {
            onError: () => toast.error("An error occurred while updating the follow status"),
        });
    };

    return (
        <PageTitle
            title="Follows"
            subtitle={isViewingOwnProfile ? "People you subscribe to their updates." : `People followed by ${profileOwner}`}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                {apiData.follows.map((follow) => {
                    const isMe = currentUser?.name === follow.username;

                    return (
                        <div key={follow.id} className="bg-background border rounded-xl p-4 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <ProfileIcon
                                            className="size-13"
                                            fallbackSize="text-lg"
                                            user={{ name: follow.username, image: follow.image }}
                                        />
                                        <div
                                            title={`Privacy: ${follow.privacy}`}
                                            className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border"
                                        >
                                            <div className="bg-background rounded-full p-0.5">
                                                <PrivacyIcon type={follow.privacy}/>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <BlockLink
                                            privacy={follow.privacy}
                                            to={"/profile/$username"}
                                            params={{ username: follow.username }}
                                        >
                                            <h3 className="text-primary font-medium hover:text-app-accent leading-none">
                                                {follow.username}
                                            </h3>
                                        </BlockLink>
                                        <p className="text-xs text-slate-500 capitalize mt-1">
                                            {follow.privacy} Profile
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-2">
                                {!currentUser &&
                                    <Button variant="outline" className="flex-1" disabled>
                                        Log-In to Follow
                                    </Button>
                                }

                                {currentUser &&
                                    <>
                                        {isMe ?
                                            <Button variant="secondary" className="flex-1" disabled>
                                                You
                                            </Button>
                                            :
                                            <Button
                                                variant={follow.isFollowedByMe ? "emeraldy" : "outline"}
                                                onClick={() => handleFollow(follow.id, follow.isFollowedByMe)}
                                                className={`flex-1 group transition-all font-bold ${follow.isFollowedByMe ?
                                                    "hover:border-destructive/50 hover:bg-destructive/40 hover:text-primary" : ""}
                                                `}
                                            >
                                                {follow.isFollowedByMe ?
                                                    <>
                                                        <span className="flex items-center gap-2 group-hover:hidden">
                                                            <UserCheck className="size-3.5"/> Following
                                                        </span>
                                                        <span className="hidden items-center gap-2 group-hover:flex">
                                                            <UserX className="size-3.5"/> Unfollow
                                                        </span>
                                                    </>
                                                    :
                                                    <>
                                                        <UserPlus className="size-3.5"/>
                                                        {isViewingOwnProfile ? "Follow Back" : "Follow"}
                                                    </>
                                                }
                                            </Button>
                                        }
                                    </>
                                }
                            </div>
                        </div>
                    );
                })}
            </div>

            {apiData.follows.length === 0 &&
                <div className="flex flex-col items-center justify-center pt-20 text-center">
                    <EmptyState
                        icon={UserX}
                        message="No Follows Found."
                    />
                </div>
            }
        </PageTitle>
    );
}
