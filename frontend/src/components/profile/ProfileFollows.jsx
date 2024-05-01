import {Link} from "react-router-dom";
import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useTransition} from "react";


export const ProfileFollows = ({ username, follows }) => {
    const { isOpen, caret, toggleCollapse } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="p-1 flex gap-2 items-center">
                        {caret} <div role="button" onClick={toggleCollapse}>Follows</div>
                    </div>
                    <div>
                        <Link to={`/profile/${username}/follows`} className="italic text-muted-foreground text-sm
                        hover:underline hover:underline-offset-2">
                            All ({follows.total})
                        </Link>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent>
                {isOpen &&
                    <div className="flex justify-start flex-wrap gap-4">
                        {follows.total === 0 ?
                            <div className="text-muted-foreground italic">No follows to display yet</div>
                            :
                            follows.follows.map(follow =>
                                <Link key={follow.username} to={`/profile/${follow.username}`}>
                                    <Tooltip text={follow.username}>
                                        <img
                                            className="w-14 h-14 bg-neutral-500 rounded-full"
                                            src={follow.profile_image}
                                            alt={follow.username}
                                        />
                                    </Tooltip>
                                </Link>
                            )}
                    </div>
                }
            </CardContent>
        </Card>
    );
};
