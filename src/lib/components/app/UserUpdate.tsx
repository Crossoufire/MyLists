import {Trash2} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {Button} from "@/lib/components/ui/button";
import {formatDateTime} from "@/lib/utils/functions";
import {Payload} from "@/lib/components/app/Payload";
import {Separator} from "@/lib/components/ui/separator";
import {BlockLink} from "@/lib/components/app/BlockLink";
import {MediaIcon} from "@/lib/components/app/MediaIcon";
import {profileOptions} from "@/lib/react-query/query-options/query-options";


interface UserUpdateProps {
    username?: string;
    canDelete: boolean;
    isPending?: boolean;
    mediaIdBeingDeleted?: number;
    onDelete: (updateId: number) => void;
    update: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["userUpdates"][0];
}


export function UserUpdate({ update, username, onDelete, canDelete, isPending, mediaIdBeingDeleted }: UserUpdateProps) {
    const handleDeleteUpdate = (updateId: number) => {
        if (!window.confirm("This update will be definitively deleted, are you sure?")) return;
        onDelete(updateId);
    };

    return (
        <>
            <div className={cn("grid grid-cols-[auto_1fr_auto] gap-x-3 py-1 pr-2 group relative",
                (mediaIdBeingDeleted === update.id && isPending) && "opacity-20")}>
                <MediaIcon
                    size={18}
                    className="mt-1 row-span-3"
                    mediaType={update.mediaType}
                />
                <div className="col-span-2">
                    <BlockLink to={`/details/${update.mediaType}/${update.mediaId}`} disabled={isPending}>
                        <div className="truncate hover:underline hover:underline-offset-2" title={update.mediaName}>
                            {update.mediaName}
                        </div>
                    </BlockLink>
                    <Payload
                        update={update}
                        className="text-neutral-300"
                    />
                    <div className="text-sm text-muted-foreground">
                        {formatDateTime(update.timestamp, { includeTime: true, useLocalTz: true })}
                        {username &&
                            <> by <BlockLink to={`/profile/${username}`} className="text-blue-500">
                                {username}
                            </BlockLink></>
                        }
                    </div>
                </div>
                {canDelete &&
                    <Button
                        variant="invisible"
                        disabled={isPending}
                        onClick={() => handleDeleteUpdate(update.id)}
                        className={"p-0 m-0 h-4 absolute top-2.5 right-0 opacity-0 hover:opacity-100 group-hover:opacity-30 " +
                            "transition-opacity"}
                    >
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                }
            </div>
            <Separator className="my-1"/>
        </>
    );
}
