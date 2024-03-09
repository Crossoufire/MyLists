import {Link} from "react-router-dom";
import {createLocalDate} from "@/lib/utils";
import {Separator} from "@/components/ui/separator";
import {Payload} from "@/components/primitives/Payload";
import {MediaIcon} from "@/components/primitives/MediaIcon";


export const UserUpdate = ({ mediaId, username, mediaType, mediaName, payload, date_ }) => {
    return (
        <>
            <div className="flex py-1 gap-3 pr-2">
                <MediaIcon mediaType={mediaType} size={18} className="mt-1"/>
                <div>
                    <Link to={`/details/${mediaType}/${mediaId}`}>
                        <div className="line-clamp-1" title={mediaName}>{mediaName}</div>
                    </Link>
                    <Payload payload={payload}/>
                    <div className="text-sm text-neutral-400">
                        {createLocalDate(date_)}
                        {username &&
                            <> by <Link to={`/profile/${username}`} className="text-blue-500">{username}</Link></>
                        }
                    </div>
                </div>
            </div>
            <Separator className="mt-1 mb-1"/>
        </>
    );
}
