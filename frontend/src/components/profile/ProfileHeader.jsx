import {useAuth} from "@/api";
import {Link} from "@tanstack/react-router";
import {formatDateTime} from "@/utils/functions";
import {CalendarDays, Users} from "lucide-react";
import {FollowButton} from "@/components/profile/FollowButton";


export const ProfileHeader = ({ user, followStatus, followId }) => {
    const { currentUser } = useAuth();
    const isConnected = (!!currentUser);
    const isCurrent = (currentUser?.id === user.id);

    return (
        <div className="relative h-72 bg-cover border-b bg-center bg-no-repeat" style={{ backgroundImage: `url(${user.back_image})` }}>
            <div className="absolute left-6 bottom-6 max-sm:-bottom-2 max-sm:left-[50%] max-sm:-translate-x-1/2">
                <div className="py-5 px-5 pt-4 rounded-lg sm:bg-gradient-to-r sm:from-slate-900 sm:to-slate-700">
                    <div className="flex flex-wrap items-center gap-8 max-sm:justify-center max-sm:gap-5">
                        <div className="relative">
                            <img
                                alt="profile-picture"
                                src={user.profile_image}
                                className="rounded-full h-[100px] w-[100px] border-4 border-amber-600 bg-neutral-500"
                            />
                            <div className="absolute -bottom-2 -right-2 text-xs font-bold px-2 py-1 rounded-full
                            bg-gradient-to-r from-blue-600 to-violet-600">
                                Lvl {user.profile_level}
                            </div>
                        </div>
                        <div className="space-y-2 max-sm:bg-gradient-to-r max-sm:from-slate-900 max-sm:to-slate-700 max-sm:py-2
                        max-sm:px-4 max-sm:rounded-lg">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold">{user.username}</h2>
                                {(!isCurrent && isConnected) &&
                                    <FollowButton
                                        followId={followId}
                                        followStatus={followStatus}
                                    />
                                }
                            </div>
                            <div className="text-gray-300 text-sm font-medium space-y-1 max-sm:min-w-[220px]">
                                <div className="flex items-center">
                                    <CalendarDays className="w-4 h-4 mr-2"/>
                                    <div>Joined: {formatDateTime(user.registered_on)}</div>
                                </div>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2"/>
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
