import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {BlockLink} from "@/lib/components/general/BlockLink";
import {MutedText} from "@/lib/components/general/MutedText";
import {UserFollowsType} from "@/lib/types/query.options.types";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";


interface ProfileFollowsProps {
    username: string;
    follows: UserFollowsType;
}


export const ProfileFollows = ({ username, follows }: ProfileFollowsProps) => {
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex gap-2">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>Following</div>
                    </div>
                </CardTitle>
                <CardAction>
                    <Link to="/profile/$username/follows" params={{ username }}>
                        <MutedText className="text-sm hover:underline">All ({follows.total})</MutedText>
                    </Link>
                </CardAction>
            </CardHeader>
            <CardContent className={contentClasses}>
                <div className="flex justify-start flex-wrap gap-4">
                    {follows.total === 0 ?
                        <MutedText>No follows to display yet</MutedText>
                        :
                        follows.follows.map(follow =>
                            <BlockLink
                                key={follow.username}
                                privacy={follow.privacy}
                                to={"/profile/$username"}
                                params={{ username: follow.username }}
                            >
                                <Tooltip text={follow.username}>
                                    <img
                                        src={follow.image!}
                                        alt={follow.username}
                                        className="w-14 h-14 bg-neutral-500 rounded-full"
                                    />
                                </Tooltip>
                            </BlockLink>,
                        )}
                </div>
            </CardContent>
        </Card>
    );
};
