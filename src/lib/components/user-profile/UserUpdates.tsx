import {useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Link, useParams} from "@tanstack/react-router";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/app/MutedText";
import {UserUpdate} from "@/lib/components/app/UserUpdate";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {UserUpdatesType} from "@/routes/_private/profile/$username/_header/index";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {useDeleteUpdatesMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface UserUpdatesProps {
    username: string;
    followers?: boolean;
    updates: UserUpdatesType;
}


export const UserUpdates = ({ updates, followers = false }: UserUpdatesProps) => {
    const { currentUser } = useAuth();
    const { caret, toggleCollapse, contentClasses } = useCollapse();
    const { username } = useParams({ from: "/_private/profile/$username" });
    const deleteUpdatesMutation = useDeleteUpdatesMutation(queryKeys.profileKey(username));
    const [mediaIdBeingDeleted, setMediaIdBeingDeleted] = useState<undefined | number>();

    const deleteUpdate = (updateId: number) => {
        setMediaIdBeingDeleted(updateId);
        deleteUpdatesMutation.mutate({ updateIds: [updateId], returnData: true });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center justify-between">
                        <div className="p-1 flex gap-2 items-center">
                            {caret}
                            <div role="button" onClick={toggleCollapse}>
                                {followers ? "Follows Last Updates" : "Last Updates"}
                            </div>
                        </div>
                        {!followers &&
                            <Link to="/profile/$username/history" params={{ username }}>
                                <MutedText className="mt-1 text-sm hover:underline">All</MutedText>
                            </Link>
                        }
                    </div>
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
                            //@ts-expect-error
                            username={followers && update?.username}
                            mediaIdBeingDeleted={mediaIdBeingDeleted}
                            isPending={deleteUpdatesMutation.isPending}
                            //@ts-expect-error
                            canDelete={(currentUser?.id === update.userId) && !followers}
                        />
                    )
                }
            </CardContent>
        </Card>
    );
};