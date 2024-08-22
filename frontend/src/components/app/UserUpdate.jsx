import {Link} from "@tanstack/react-router";
import {createLocalDate} from "@/lib/utils";
import {Separator} from "@/components/ui/separator";
import {Payload} from "@/components/app/base/Payload";
import {MediaIcon} from "@/components/app/base/MediaIcon";


export const UserUpdate = ({ update, username }) => {
    return (
        <>
            <div className="flex py-1 gap-3 pr-2">
                <MediaIcon
                    size={18}
                    className="mt-1"
                    mediaType={update.media_type}
                />
                <div>
                    <Link to={`/details/${update.media_type}/${update.media_id}`}>
                        <div className="line-clamp-1" title={update.media_name}>
                            {update.media_name}
                        </div>
                    </Link>
                    <Payload
                        payload={update.update_data}
                        updateType={update.update_type}
                    />
                    <div className="text-sm text-neutral-400">
                        {createLocalDate(update.timestamp)}
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
