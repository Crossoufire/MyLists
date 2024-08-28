import {toast} from "sonner";
import {useState} from "react";
import {FaPen} from "react-icons/fa";
import {api} from "@/api/MyApiClient";
import {formatDateTime} from "@/lib/utils";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useMutation} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {useUser} from "@/providers/UserProvider";


export const ProfileHeader = ({ user, initFollow, followId }) => {
    const { currentUser } = useUser();
    const isCurrent = (currentUser.id === user.id);

    return (
        <div className="relative h-72 bg-cover border-b bg-center bg-no-repeat" style={{backgroundImage: `url(${user.back_image})`}}>
            {isCurrent &&
                <Tooltip text="Change background image" side="bottom">
                    <Link to="/settings" className="absolute top-4 right-4 opacity-40 hover:opacity-70">
                        <FaPen size={20}/>
                    </Link>
                </Tooltip>
            }
            <div className="absolute h-56 w-56 bottom-[-1rem] left-4 max-xs:-top-5 max-xs:left-[50%] max-xs:-translate-x-1/2">
                {isCurrent ?
                    <Link to="/settings">
                        <Tooltip text="Change profile image">
                            <img
                                src={user.profile_image}
                                className="z-10 absolute left-[50%] bottom-[5px] h-[97px] w-[97px] transform
                                -translate-x-1/2 -translate-y-1/2 hover:brightness-50 rounded-full"
                                alt="profile-picture"
                            />
                        </Tooltip>
                    </Link>
                    :
                    <img
                        src={user.profile_image}
                        className="z-10 absolute left-[50%] bottom-1.5 h-24 w-24 transform -translate-x-1/2
                        -translate-y-1/2 rounded-full"
                        alt="profile-picture"
                    />
                }
                <img
                    src={user.profile_border}
                    className="z-0 absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 h-56 w-56"
                    alt="profile-header-frame"
                />
                <Badge variant="passive" className="z-10 absolute bottom-[22px] left-[50%] transform -translate-x-1/2 -translate-y-1/2">
                    {user.profile_level}
                </Badge>
            </div>
            <div className="absolute left-[242px] bottom-[25px] max-xs:bottom-3 max-xs:left-[50%] max-xs:-translate-x-1/2">
                <div className="flex gap-3 items-center font-medium mb-2 mt-0">
                    <div className="text-3xl">{user.username}</div>
                    {!isCurrent &&
                        <FollowButton
                            followId={followId}
                            initFollow={initFollow}
                        />
                    }
                </div>
                <div className="font-medium">
                    <div>Joined: {formatDateTime(user.registered_on)}</div>
                    <Link to={`/profile/${user.username}/followers`}>
                        <div className="hover:underline hover:underline-offset-2">
                            Followers: {user.followers_count}
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};


const FollowButton = ({ initFollow, followId }) => {
    const [isLoading, handleLoading] = useMutation();
    const [isFollowing, setFollowing] = useState(initFollow);

    const content = isFollowing ? "Unfollow" : "Follow";
    const buttonColor = isFollowing ? "destructive" : "secondary";

    const updateFollow = async (followId, followValue) => {
        const response = await api.post("/update_follow", {
            follow_id: followId,
            follow_status: followValue,
        });

        if (!response.ok) {
            toast.error("The following status could not be processed");
            return false;
        }

        return true;
    };

    const handleFollow = async () => {
        const response = await handleLoading(updateFollow, followId, !isFollowing);
        if (response) {
            setFollowing(!isFollowing);
        }
    };

    return (
        <Button variant={buttonColor} size="xs" onClick={handleFollow} disabled={isLoading}>
            <div className="font-semibold">{content}</div>
        </Button>
    )
};