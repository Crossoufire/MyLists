import {toast} from "sonner";
import {useParams} from "@tanstack/react-router";
import {UserMinus, UserPlus} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {useFollowMutation} from "@/lib/client/react-query/query-mutations/user.mutations";


interface FollowButtonProps {
    followId: number;
    followStatus: boolean;
}


export const FollowButton = ({ followStatus, followId }: FollowButtonProps) => {
    const { username } = useParams({ from: "/_main/_private/profile/$username" });
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
                <><UserMinus className="mr-1 h-4 w-4"/>Unfollow</>
                :
                <><UserPlus className="mr-1 h-4 w-4"/>Follow</>
            }
        </Button>
    );
};
