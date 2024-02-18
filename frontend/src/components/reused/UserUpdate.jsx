import {Link} from "react-router-dom";
import {Payload} from "@/components/primitives/Payload";
import {createLocalDate, getMediaIcon} from "@/lib/utils";


export const UserUpdate = ({ mediaId, username, mediaType, mediaName, payload, date_ }) => (
    <div className="flex flex-row pb-2 px-2 gap-3 w-full">
        <div className="mt-2">
            {getMediaIcon(mediaType, 18)}
        </div>
        <div>
            <Link to={`/details/${mediaType}/${mediaId}`}>
                <div className="line-clamp-1">{mediaName}</div>
            </Link>
            <Payload payload={payload}/>
            <span className="text-sm text-neutral-400">
                {createLocalDate(date_)}
                {username &&
                    <>
                        &nbsp;by <Link to={`/profile/${username}`} className="text-blue-500">
                            {username}
                        </Link>
                    </>
                }
            </span>
        </div>
    </div>
);

