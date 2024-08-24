import {formatDateTime} from "@/lib/utils";
import {Link} from "@tanstack/react-router";
import {Separator} from "@/components/ui/separator";
import {Payload} from "@/components/app/base/Payload";
import {MediaIcon} from "@/components/app/base/MediaIcon";


export const UserUpdate = ({ update, username }) => {
    return (
        <>
            <div className="flex py-1 gap-3 pr-2">
                <MediaIcon size={18} className="mt-1" mediaType={update.media_type}/>
                <div>
                    <Link to={`/details/${update.media_type}/${update.media_id}`}>
                        <div className="line-clamp-1" title={update.media_name}>
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
                </div>
            </div>
            <Separator className="mt-1 mb-1"/>
        </>
    );
};
