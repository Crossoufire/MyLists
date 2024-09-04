import {FaRedo} from "react-icons/fa";
import {Tooltip} from "@/components/ui/tooltip";
import {cn, formatDateTime} from "@/utils/functions";
import {useRefreshMutation} from "@/utils/mutations";


export const RefreshMedia = ({ mediaType, mediaId, lastUpdate }) => {
    const refreshMutation = useRefreshMutation(mediaType, mediaId);
    const lastRefresh = lastUpdate ? formatDateTime(lastUpdate, {includeTime: true, useLocalTz: true}) : "Never";

    return (
        <Tooltip text="Refresh metadata" subText={`Last refresh: ${lastRefresh}`} side="left">
            <div role="button" onClick={() => refreshMutation.mutate()}>
                <FaRedo size={18} className={cn("mt-2", refreshMutation.isPending && "animate-spin opacity-30")}/>
            </div>
        </Tooltip>
    );
};
