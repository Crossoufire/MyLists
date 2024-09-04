import {LuTrash2} from "react-icons/lu";
import {Link} from "@tanstack/react-router";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {cn, formatDateTime} from "@/utils/functions";
import {Payload} from "@/components/app/base/Payload";
import {MediaIcon} from "@/components/app/base/MediaIcon";


export const UserUpdate = ({ update, username, onDelete, canDelete, isPending, mediaIdBeingDeleted }) => {
    const handleDeleteUpdate = async (updateId) => {
        if (!window.confirm("This update will be definitively deleted, are you sure?")) return;
        await onDelete(updateId);
    };

    return (
        <>
            <div className={cn("flex relative py-1 gap-3 pr-2 group", (mediaIdBeingDeleted === update.id && isPending) && "opacity-20")}>
                <MediaIcon size={18} className="mt-1" mediaType={update.media_type}/>
                <div>
                    <Link to={`/details/${update.media_type}/${update.media_id}`} disabled={isPending}>
                        <div className="line-clamp-1 hover:underline hover:underline-offset-2" title={update.media_name}>
                            {update.media_name}
                        </div>
                    </Link>
                    <Payload update={update}/>
                    <div className="text-sm text-neutral-400">
                        {formatDateTime(update.timestamp, { includeTime: true, useLocalTz: true })}
                        {username &&
                            <> by <Link to={`/profile/${username}`} className="text-blue-500">{username}</Link></>
                        }
                    </div>
                    {canDelete &&
                        <Button
                            variant="invisible"
                            className="p-0 m-0 h-4 absolute top-2.5 right-0 opacity-0 hover:opacity-100
                            group-hover:opacity-30 transition-opacity"
                            onClick={() => handleDeleteUpdate(update.id)}
                            disabled={isPending}
                        >
                            {isPending ? "" : <LuTrash2 className="h-4 w-4" title="Delete update"/>}
                        </Button>
                    }
                </div>
            </div>
            <Separator className="mt-1 mb-1"/>
        </>
    );
};
