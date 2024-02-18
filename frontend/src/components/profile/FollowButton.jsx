import {toast} from "sonner";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useLoading} from "@/hooks/LoadingHook";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";


export const FollowButton = ({ initFollow, followId }) => {
    const api = useApi();
    const [isLoading, handleLoading] = useLoading();
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
    }

    const handleFollow = async () => {
        const response = await handleLoading(updateFollow, followId, !isFollowing);
        if (response) {
            setFollowing(!isFollowing);
        }
    };

    return (
        <Button variant={buttonColor} size="xs" onClick={handleFollow}>
            {isLoading ?
                <LoadingIcon loading size={6}/>
                :
                <div className="font-semibold">{content}</div>
            }
        </Button>
    )
};
