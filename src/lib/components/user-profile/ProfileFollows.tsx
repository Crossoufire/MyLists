import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Separator} from "@/lib/components/ui/separator";
import {BlockLink} from "@/lib/components/app/BlockLink";
import {MutedText} from "@/lib/components/app/MutedText";
import {profileOptions} from "@/lib/react-query/query-options";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";


interface ProfileFollowsProps {
    username: string;
    follows: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["userFollows"];
}


export const ProfileFollows = ({ username, follows }: ProfileFollowsProps) => {
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
                        {/*//@ts-expect-error*/}
                        <Link to="/profile/$username/follows" params={{ username }}>
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
                                {/*//@ts-ignore*/}
                                <Tooltip text={follow.username}>
                                    <img
                                        className="w-14 h-14 bg-neutral-500 rounded-full"
                                        src={follow.image!}
                                        alt={follow.username}
                                    />
                                </Tooltip>
                            </BlockLink>,
                        )}
                </div>
            </CardContent>
        </Card>
    );
};
