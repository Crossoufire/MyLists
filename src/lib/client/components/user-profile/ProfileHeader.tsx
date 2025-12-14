import {Link} from "@tanstack/react-router";
import {CalendarDays, Users} from "lucide-react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {UserDataType} from "@/lib/types/query.options.types";
import {computeLevel, formatDateTime} from "@/lib/utils/functions";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {FollowButton} from "@/lib/client/components/user-profile/FollowButton";


interface ProfileHeaderProps {
    followId: number;
    user: UserDataType;
    followStatus: boolean;
}


export const ProfileHeader = ({ user, followStatus, followId }: ProfileHeaderProps) => {
    const { currentUser } = useAuth();
    const isConnected = (!!currentUser);
    const isCurrent = (currentUser?.id === user.id);
    const userLevel = computeLevel(user.userMediaSettings.reduce((acc, cur) => cur.active ? acc + cur.timeSpent : acc, 0));

    return (
        <div className="relative h-72 bg-cover border-b bg-center bg-no-repeat" style={{ backgroundImage: `url(${user.backgroundImage})` }}>
            <div className="absolute left-6 bottom-6 max-sm:-bottom-2 max-sm:left-[50%] max-sm:-translate-x-1/2">
                <div className="py-5 px-5 pt-4 rounded-lg sm:bg-linear-to-r sm:from-slate-900 sm:to-slate-700">
                    <div className="flex flex-wrap items-center gap-8 max-sm:justify-center max-sm:gap-5">
                        <div className="relative">
                            <ProfileIcon
                                user={{ image: user.image, name: user.name }}
                                className="size-25 border-4 border-amber-600"
                            />
                            <div className="absolute -bottom-2 -right-2 text-xs font-bold px-2 py-1 rounded-full
                            bg-linear-to-r from-blue-600 to-violet-600">
                                Lvl {userLevel.toFixed(0)}
                            </div>
                        </div>
                        <div className="space-y-2 max-sm:bg-linear-to-r max-sm:from-slate-900 max-sm:to-slate-700 max-sm:py-2
                        max-sm:px-4 max-sm:rounded-lg">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold">
                                    <Link
                                        className="hover:underline hover:underline-offset-2"
                                        to="/profile/$username" params={{ username: user.name }}
                                    >
                                        {user.name}
                                    </Link>
                                </h2>
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
                                    <div>Joined: {formatDateTime(user.createdAt, { noTime: true })}</div>
                                </div>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2"/>
                                    <Link to="/profile/$username/followers" params={{ username: user.name }}>
                                        <div className="hover:underline">Followers: {user.followersCount}</div>
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
