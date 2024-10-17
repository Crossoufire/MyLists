import {LuTrash2} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {Payload} from "@/components/app/Payload";
import {Separator} from "@/components/ui/separator";
import {BlockLink} from "@/components/app/BlockLink";
import {cn, formatDateTime} from "@/utils/functions";
import {MediaIcon} from "@/components/app/MediaIcon";


export function UserUpdate({ update, username, onDelete, canDelete, isPending, mediaIdBeingDeleted }) {
    const handleDeleteUpdate = async (updateId) => {
        if (!window.confirm("This update will be definitively deleted, are you sure?")) return;
        await onDelete(updateId);
    };

    return (
        <>
            <div className={cn("grid grid-cols-[auto,1fr,auto] gap-x-3 py-1 pr-2 group relative",
                (mediaIdBeingDeleted === update.id && isPending) && "opacity-20")}>
                <MediaIcon size={18} className="mt-1 row-span-3" mediaType={update.media_type}/>
                <div className="col-span-2">
                    <BlockLink to={`/details/${update.media_type}/${update.media_id}`} disabled={isPending}>
                        <div className="truncate hover:underline hover:underline-offset-2" title={update.media_name}>
                            {update.media_name}
                        </div>
                    </BlockLink>
                    <Payload update={update} className="text-neutral-300"/>
                    <div className="text-sm text-muted-foreground">
                        {formatDateTime(update.timestamp, { includeTime: true, useLocalTz: true })}
                        {username && <> by <BlockLink to={`/profile/${username}`} className="text-blue-500">{username}</BlockLink></>}
                    </div>
                </div>
                {canDelete &&
                    <Button
                        variant="invisible"
                        disabled={isPending}
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="p-0 m-0 h-4 absolute top-2.5 right-0 opacity-0 hover:opacity-100 group-hover:opacity-30 transition-opacity"
                    >
                        <LuTrash2/>
                    </Button>
                }
            </div>
            <Separator className="my-1"/>
        </>
    );
}