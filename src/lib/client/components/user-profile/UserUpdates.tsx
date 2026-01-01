import {useState} from "react";
import {Activity} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Link, useParams} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {UserUpdateType} from "@/lib/types/query.options.types";
import {UserUpdate} from "@/lib/client/components/general/UserUpdate";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {useDeleteProfileUpdateMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface UserUpdatesProps {
    updates: (UserUpdateType & { username?: string | null })[];
}


export const UserUpdates = ({ updates }: UserUpdatesProps) => {
    const { currentUser } = useAuth();
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState<undefined | number>();
    const { username } = useParams({ from: "/_main/_private/profile/$username/_header" });
    const deleteUpdatesMutation = useDeleteProfileUpdateMutation(username);

    const deleteUpdate = (updateId: number) => {
        setMediaIdBeingDeleted(updateId);
        deleteUpdatesMutation.mutate({ data: { updateIds: [updateId], returnData: true } });
    };

    return (
        <Card className={cn(updates.length === 0 && "h-fit")}>
            <CardHeader>
                <CardTitle>
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {updates.length === 0 ?
                    <EmptyState
                        icon={Activity}
                        className="py-2"
                        message="No recent activity found."
                    />
                    :
                    <div className="flex flex-col gap-1">
                        {updates.map((update) =>
                            <UserUpdate
                                key={update.id}
                                update={update}
                                onDelete={deleteUpdate}
                                mediaIdBeingDeleted={mediaIdBeingDeleted}
                                isPending={deleteUpdatesMutation.isPending}
                                canDelete={(currentUser?.id === update.userId)}
                            />
                        )}
                    </div>
                }
                {updates.length !== 0 &&
                    <Button className="mt-4" variant="dashed" asChild>
                        <Link to="/profile/$username/history" params={{ username }}>
                            View all Activities
                        </Link>
                    </Button>
                }
            </CardContent>
        </Card>
    );
};


export const FollowsUpdates = ({ updates }: UserUpdatesProps) => {
    return (
        <Card className={cn("h-120", updates.length === 0 && "h-fit")}>
            <CardHeader>
                <CardTitle>
                    Follows Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto scrollbar-thin">
                <div className="pr-2">
                    {updates.length === 0 ?
                        <EmptyState
                            icon={Activity}
                            message="No follows activity found."
                        />
                        :
                        <div className="flex flex-col gap-1 ">
                            {updates.map((update) =>
                                <UserUpdate
                                    key={update.id}
                                    update={update}
                                    canDelete={false}
                                    username={update.username}
                                />
                            )}
                        </div>
                    }
                </div>
            </CardContent>
        </Card>
    );
};
