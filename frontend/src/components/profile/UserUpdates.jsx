import {Fragment} from "react";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {UserUpdate} from "@/components/app/UserUpdate";
import {Link, useParams} from "@tanstack/react-router";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const UserUpdates = ({ updates, followers = false }) => {
    const { username } = useParams({ strict: false });
    const { isOpen, caret, toggleCollapse } = useCollapse();

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
                        <Link to={`/profile/${username}/history`} className="text-sm hover:underline text-muted-foreground">
                            <i>All</i>
                        </Link>
                    }
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className="pb-3">
                {isOpen &&
                    <>
                        {updates.length === 0 ?
                            <div className="text-muted-foreground italic pb-3">No updates to display yet</div>
                            :
                            updates.map(update =>
                                <UserUpdate
                                    update={update}
                                    key={update.timestamp}
                                    username={followers && update.username}
                                />
                            )}
                    </>
                }
            </CardContent>
        </Card>
    );
};