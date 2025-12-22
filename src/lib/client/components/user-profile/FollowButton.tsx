import {toast} from "sonner";
import {UserMinus, UserPlus} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {useFollowMutation} from "@/lib/client/react-query/query-mutations/user.mutations";


interface FollowButtonProps {
    username: string;
    followId: number;
    followStatus: boolean;
}


export const FollowButton = ({ username, followStatus, followId }: FollowButtonProps) => {
    const updateFollowMutation = useFollowMutation(username);

    const handleFollow = () => {
        updateFollowMutation.mutate({ data: { followId, followStatus: !followStatus } }, {
            onError: () => toast.error("An error occurred while updating the follow status"),
        });
    };

    return (
        <Button
            size="sm"
            onClick={handleFollow}
            disabled={updateFollowMutation.isPending}
            variant={followStatus ? "destructive" : "outline"}
        >
            {followStatus ?
                <><UserMinus className="mr-1 size-4"/>Unfollow</>
                :
                <><UserPlus className="mr-1 size-4"/>Follow</>
            }
        </Button>
    );
};
