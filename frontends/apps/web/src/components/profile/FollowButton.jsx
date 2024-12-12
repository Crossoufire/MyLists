import React from "react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {UserMinus, UserPlus} from "lucide-react";
import {useParams} from "@tanstack/react-router";
import {queryKeys, useFollowMutation} from "@mylists/api/src";


export const FollowButton = ({ followStatus, followId }) => {
    const { username } = useParams({ strict: false });
    const updateFollowStatus = useFollowMutation(queryKeys.profileKey(username));

    const handleFollow = () => {
        updateFollowStatus.mutate({ followId, followStatus: !followStatus }, {
            onError: () => toast.error("An error occurred while updating the follow status"),
        });
    };

    return (
        <Button variant={followStatus ? "destructive" : "outline"} size="xs" onClick={handleFollow} disabled={updateFollowStatus.isPending}>
            {followStatus ? <><UserMinus className="mr-2 h-4 w-4"/>Unfollow</> : <><UserPlus className="mr-2 h-4 w-4"/>Follow</>}
        </Button>
    );
};
