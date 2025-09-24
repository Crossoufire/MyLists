import {useState} from "react";
import {cn} from "@/lib/utils/helpers";
import {useAuth} from "@/lib/hooks/use-auth";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Link, useParams} from "@tanstack/react-router";
import {MutedText} from "@/lib/components/general/MutedText";
import {UserUpdateType} from "@/lib/types/query.options.types";
import {UserUpdate} from "@/lib/components/general/UserUpdate";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {useDeleteUpdatesMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface UserUpdatesProps {
    followers?: boolean;
    updates: (UserUpdateType & { username?: string | null })[];
}


export const UserUpdates = ({ updates, followers = false }: UserUpdatesProps) => {
    const { currentUser } = useAuth();
    const { caret, toggleCollapse, contentClasses } = useCollapse();
    const { username } = useParams({ from: "/_main/_private/profile/$username" });
    const deleteUpdatesMutation = useDeleteUpdatesMutation(queryKeys.profileKey(username));
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState<undefined | number>();

    const deleteUpdate = (updateId: number) => {
        setMediaIdBeingDeleted(updateId);
        deleteUpdatesMutation.mutate({ data: { updateIds: [updateId], returnData: true } });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex gap-2">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>
                            {followers ? "Follows Last Updates" : "Last Updates"}
                        </div>
                    </div>
                </CardTitle>
                {!followers &&
                    <CardAction>
                        <Link to="/profile/$username/history" params={{ username }}>
                            <MutedText className="text-sm hover:underline">All</MutedText>
                        </Link>
                    </CardAction>
                }
            </CardHeader>
            <CardContent className={cn("relative", contentClasses)}>
                {updates.length === 0 ?
                    <MutedText>No updates to display yet</MutedText>
                    :
                    updates.map(update =>
                        <UserUpdate
                            key={update.id}
                            update={update}
                            onDelete={deleteUpdate}
                            mediaIdBeingDeleted={mediaIdBeingDeleted}
                            isPending={deleteUpdatesMutation.isPending}
                            username={followers ? update?.username : ""}
                            canDelete={(currentUser?.id === update.userId) && !followers}
                        />
                    )
                }
            </CardContent>
        </Card>
    );
};