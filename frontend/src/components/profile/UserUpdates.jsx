import {Fragment} from "react";
import {Link, useParams} from "react-router-dom";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {UserUpdate} from "@/components/reused/UserUpdate";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const UserUpdates = ({ updates, followers = false }) => {
    const { username } = useParams();
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
                                    key={update.date}
                                    username={followers && update.username}
                                    mediaType={update.media_type}
                                    mediaId={update.media_id}
                                    mediaName={update.media_name}
                                    payload={update.update}
                                    date_={update.date}
                                />
                            )}
                    </>
                }
            </CardContent>
        </Card>
    );
};