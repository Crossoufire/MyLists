import {Link} from "@tanstack/react-router";
import {useCollapse} from "@/lib/client/hooks/use-collapse";
import {BlockLink} from "@/lib/client/components/general/BlockLink";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {UserFollowsType} from "@/lib/types/query.options.types";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/client/components/ui/tooltip";
import {Card, CardAction, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";


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
                        follows.follows.map((follow) =>
                            <Tooltip key={follow.id}>
                                <TooltipTrigger asChild>
                                    <BlockLink
                                        key={follow.username}
                                        to="/profile/$username"
                                        privacy={follow.privacy}
                                        params={{ username: follow.username }}
                                    >
                                        <ProfileIcon
                                            fallbackSize="text-lg"
                                            className="size-14 border-2"
                                            user={{ image: follow.image, name: follow.username }}
                                        />
                                    </BlockLink>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {follow.username}
                                </TooltipContent>
                            </Tooltip>
                        )}
                </div>
            </CardContent>
        </Card>
    );
};
