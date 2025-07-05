import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Separator} from "@/lib/components/ui/separator";
import {BlockLink} from "@/lib/components/general/BlockLink";
import {MutedText} from "@/lib/components/general/MutedText";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";

import {UserFollowsType} from "@/lib/components/types";


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
                    <div className="p-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>Follows</div>
                    </div>
                    <div>
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
                            <BlockLink
                                key={follow.username}
                                privacy={follow.privacy}
                                to={"/profile/$username"}
                                params={{ username: follow.username }}
                            >
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
