import {toast} from "sonner";
import {useParams} from "@tanstack/react-router";
import {UserMinus, UserPlus} from "lucide-react";
import {Button} from "@/lib/components/ui/button";
import {queryKeys} from "@/lib/react-query/query-options";
import {useFollowMutation} from "@/lib/react-query/mutations/user.mutations";


interface FollowButtonProps {
    followId: number;
    followStatus: boolean;
}


export const FollowButton = ({ followStatus, followId }: FollowButtonProps) => {
    const { username } = useParams({ from: "/_private/profile/$username" });
    const updateFollowMutation = useFollowMutation(queryKeys.profileKey(username));

    const handleFollow = () => {
        updateFollowMutation.mutate({ followId, followStatus: !followStatus }, {
            onError: () => toast.error("An error occurred while updating the follow status"),
        });
    };

    return (
        <Button variant={followStatus ? "destructive" : "outline"} size="sm" onClick={handleFollow}>
            {followStatus ?
                <><UserMinus className="mr-1 h-4 w-4"/>Unfollow</>
                :
                <><UserPlus className="mr-1 h-4 w-4"/>Follow</>
            }
        </Button>
    );
};
