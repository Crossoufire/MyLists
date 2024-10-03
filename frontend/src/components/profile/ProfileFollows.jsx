import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {BlockLink} from "@/components/app/BlockLink";
import {MutedText} from "@/components/app/base/MutedText";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const ProfileFollows = ({ username, follows }) => {
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="p-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>Follows</div>
                    </div>
                    <div>
                        <Link to={`/profile/${username}/follows`}>
                            <MutedText className="mt-1 text-sm hover:underline">All ({follows.total})</MutedText>
                        </Link>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className={contentClasses}>
                <div className="flex justify-start flex-wrap gap-4">
                    {follows.total === 0 ?
                        <div className="text-muted-foreground italic">No follows to display yet</div>
                        :
                        follows.follows.map(follow =>
                            <BlockLink key={follow.username} to={`/profile/${follow.username}`} privacy={follow.privacy}>
                                <Tooltip text={follow.username}>
                                    <img
                                        className="w-14 h-14 bg-neutral-500 rounded-full"
                                        src={follow.profile_image}
                                        alt={follow.username}
                                    />
                                </Tooltip>
                            </BlockLink>
                        )}
                </div>
            </CardContent>
        </Card>
    );
};
