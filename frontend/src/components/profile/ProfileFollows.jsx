import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {Link, useParams} from "@tanstack/react-router";
import {MutedText} from "@/components/app/base/MutedText";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const ProfileFollows = ({ follows }) => {
    const { username } = useParams({ strict: false });
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
                            <MutedText text="No follows to display yet"/>
                            :
                            follows.follows.map(follow =>
                                <Link key={follow.username} to={`/profile/${follow.username}`}>
                                    <Tooltip text={follow.username}>
                                        <img
                                            alt={follow.username}
                                            src={follow.profile_cover}
                                            className={"w-14 h-14 bg-neutral-500 rounded-full"}
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
