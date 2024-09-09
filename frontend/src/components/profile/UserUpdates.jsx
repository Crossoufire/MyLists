import {useState} from "react";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {Link, useParams} from "@tanstack/react-router";
import {UserUpdate} from "@/components/app/UserUpdate";
import {MutedText} from "@/components/app/base/MutedText";
import {useDeleteUpdateMutation} from "@/api/mutations.js";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useAuth} from "@/hooks/AuthHook.jsx";


export const UserUpdates = ({ updates, followers = false }) => {
    const { currentUser } = useAuth();
    const { username } = useParams({ strict: false });
    const { isOpen, caret, toggleCollapse } = useCollapse();
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState();
    const deleteUserUpdates = useDeleteUpdateMutation(["profile", username]);

    const deleteUpdate = async (updateId) => {
        setMediaIdBeingDeleted(updateId);
        await deleteUserUpdates.mutateAsync({ updateIds: [updateId], returnData: true });
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
            <CardContent className="pb-3 relative">
                {isOpen &&
                    <>
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
                                    canDelete={(currentUser.id === update.user_id) && !followers}
                                />
                            )
                        }
                    </>
                }
            </CardContent>
        </Card>
    );
};