import {toast} from "sonner";
import {useAuth} from "@/hooks/AuthHook";
import {Button} from "@/components/ui/button";
import {formatDateTime} from "@/utils/functions";
import {Link, useParams} from "@tanstack/react-router";
import {useFollowMutation} from "@/api/mutations/simpleMutations";
import {LuCalendarDays, LuUserMinus, LuUserPlus, LuUsers} from "react-icons/lu";


export const ProfileHeader = ({ user, followStatus, followId }) => {
    const { currentUser } = useAuth();
    const isCurrent = (currentUser.id === user.id);

    return (
        <div className="relative h-72 bg-cover border-b bg-center bg-no-repeat" style={{ backgroundImage: `url(${user.back_image})` }}>
            <div className="absolute left-6 bottom-6 max-sm:-bottom-2 max-sm:left-[50%] max-sm:-translate-x-1/2">
                <div className="py-5 px-5 pt-4 rounded-lg sm:bg-gradient-to-r sm:from-slate-900 sm:to-slate-700">
                    <div className="flex flex-wrap items-center gap-8 max-sm:justify-center max-sm:gap-5">
                        <div className="relative">
                            <img
                                alt="profile-picture"
                                src={user.profile_image}
                                className="rounded-full h-[100px] w-[100px] border-4 border-amber-600"
                            />
                            <div className="absolute -bottom-2 -right-2 text-xs font-bold px-2 py-1 rounded-full
                            bg-gradient-to-r from-blue-600 to-violet-600">
                                Lvl {user.profile_level}
                            </div>
                        </div>
                        <div className="space-y-3 max-sm:bg-gradient-to-r max-sm:from-slate-900 max-sm:to-slate-700 max-sm:py-2
                        max-sm:px-4 max-sm:rounded-lg">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold">{user.username}</h2>
                                {!isCurrent &&
                                    <FollowButton
                                        followId={followId}
                                        followStatus={followStatus}
                                    />
                                }
                            </div>
                            <div className="text-gray-300 text-sm font-medium space-y-1 max-sm:min-w-[220px]">
                                <div className="flex items-center">
                                    <LuCalendarDays className="w-4 h-4 mr-2"/>
                                    <div>Joined: {formatDateTime(user.registered_on)}</div>
                                </div>
                                <div className="flex items-center">
                                    <LuUsers className="w-4 h-4 mr-2"/>
                                    <Link to={`/profile/${user.username}/followers`}>
                                        <div className="hover:underline">Followers: {user.followers_count}</div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const FollowButton = ({ followStatus, followId }) => {
    const { username } = useParams({ strict: false });
    const updateFollowStatus = useFollowMutation(["profile", username]);

    const handleFollow = () => {
        updateFollowStatus.mutate({ followId, followStatus: !followStatus }, {
            onError: () => toast.error("An error occurred while updating the follow status"),
        });
    };

    return (
        <Button variant={followStatus ? "destructive" : "outline"} size="xs" onClick={handleFollow} disabled={updateFollowStatus.isPending}>
            {followStatus ? <><LuUserMinus className="mr-2 h-4 w-4"/>Unfollow</> : <><LuUserPlus className="mr-2 h-4 w-4"/>Follow</>}
        </Button>
    );
};
