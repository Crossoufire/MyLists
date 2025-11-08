import {Trash2} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {formatDateTime} from "@/lib/utils/functions";
import {Button} from "@/lib/client/components/ui/button";
import {Separator} from "@/lib/client/components/ui/separator";
import {UserUpdateType} from "@/lib/types/query.options.types";
import {Payload} from "@/lib/client/components/general/Payload";
import {BlockLink} from "@/lib/client/components/general/BlockLink";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";


interface UserUpdateProps {
    canDelete: boolean;
    isPending?: boolean;
    update: UserUpdateType;
    username?: string | null;
    mediaIdBeingDeleted?: number;
    onDelete: (updateId: number) => void;
}


export function UserUpdate({ update, username, onDelete, canDelete, isPending, mediaIdBeingDeleted }: UserUpdateProps) {
    const handleDeleteUpdate = (updateId: number) => {
        if (!window.confirm("This update will be definitively deleted, are you sure?")) return;
        onDelete(updateId);
    };

    return (
        <>
            <div
                className={cn(
                    "grid grid-cols-[auto_1fr_auto] gap-x-3 py-1 pr-2 group relative",
                    (mediaIdBeingDeleted === update.id && isPending) && "opacity-20"
                )}
            >
                <MediaAndUserIcon
                    size={18}
                    type={update.mediaType}
                    className="mt-1 row-span-3"
                />
                <div className="col-span-2">
                    <BlockLink
                        disabled={isPending}
                        to="/details/$mediaType/$mediaId"
                        params={{ mediaType: update.mediaType, mediaId: update.mediaId }}
                    >
                        <div className="truncate hover:underline hover:underline-offset-2" title={update.mediaName}>
                            {update.mediaName}
                        </div>
                    </BlockLink>
                    <Payload
                        update={update}
                        className="text-neutral-300"
                    />
                    <MutedText className="text-sm" italic={false}>
                        {formatDateTime(update.timestamp)}
                        {username &&
                            <> by{" "}
                                <BlockLink
                                    params={{ username }}
                                    to="/profile/$username"
                                    className="text-blue-500"
                                >
                                    {username}
                                </BlockLink>
                            </>
                        }
                    </MutedText>
                </div>
                {canDelete &&
                    <Button
                        variant="invisible"
                        disabled={isPending}
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="p-1 h-6 absolute top-0 right-0 bg-background/80 backdrop-blur-sm rounded
                        transition-all duration-200 ease-out opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                }
            </div>
            <Separator className="my-1 last:hidden"/>
        </>
    );
}
