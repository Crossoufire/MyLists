import React from "react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {useParams} from "@tanstack/react-router";
import {LuUserMinus, LuUserPlus} from "react-icons/lu";
import {useFollowMutation} from "@/api/mutations/simpleMutations";


export const FollowButton = ({ followStatus, followId }) => {
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
