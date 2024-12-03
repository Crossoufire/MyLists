import {useState} from "react";
import {useCollapse} from "@/hooks/useCollapse";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";
import {Link, useParams} from "@tanstack/react-router";
import {UserUpdate} from "@/components/app/UserUpdate";
import {queryKeys, useAuth, useDeleteUpdateMutation} from "@mylists/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const UserUpdates = ({ updates, followers = false }) => {
    const { currentUser } = useAuth();
    const { username } = useParams({ strict: false });
    const { caret, toggleCollapse, contentClasses } = useCollapse();
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState();
    const deleteUserUpdates = useDeleteUpdateMutation(queryKeys.profileKey(username));

    const deleteUpdate = (updateId) => {
        setMediaIdBeingDeleted(updateId);
        deleteUserUpdates.mutate({ updateIds: [updateId], returnData: true });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="p-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>
                            {followers ? "Follows Last Updates" : "Last Updates"}
                        </div>
                    </div>
                    {!followers &&
                        <Link to={`/profile/${username}/history`}>
                            <MutedText className="mt-1 text-sm hover:underline">All</MutedText>
                        </Link>
                    }
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className={`pb-3 relative ${contentClasses}`}>
                {updates.length === 0 ?
                    <MutedText className="pb-3">No updates to display yet</MutedText>
                    :
                    updates.map(update =>
                        <UserUpdate
                            key={update.id}
                            update={update}
                            onDelete={deleteUpdate}
                            isPending={deleteUserUpdates.isPending}
                            username={followers && update.username}
                            mediaIdBeingDeleted={mediaIdBeingDeleted}
                            canDelete={(currentUser?.id === update.user_id) && !followers}
                        />
                    )
                }
            </CardContent>
        </Card>
    );
};