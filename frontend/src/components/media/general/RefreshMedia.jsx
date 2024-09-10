import {toast} from "sonner";
import {FaRedo} from "react-icons/fa";
import {Tooltip} from "@/components/ui/tooltip";
import {cn, formatDateTime} from "@/utils/functions.jsx";
import {useRefreshMutation} from "@/api/mutations/simpleMutations.js";


export const RefreshMedia = ({ mediaType, mediaId, lastUpdate }) => {
    const refreshMutation = useRefreshMutation(["details", mediaType, mediaId.toString()]);
    const lastRefresh = lastUpdate ? formatDateTime(lastUpdate, { includeTime: true, useLocalTz: true }) : "Never";

    const handleRefresh = () => {
        refreshMutation.mutate({ mediaType, mediaId }, {
            onError: () => toast.error("An error occurred while refreshing the mediadata"),
            onSuccess: () => toast.success("Mediadata successfully refreshed"),
        });
    };

    return (
        <Tooltip text="Refresh metadata" subText={`Last refresh: ${lastRefresh}`} side="left">
            <div role="button" onClick={handleRefresh}>
                <FaRedo size={18} className={cn("mt-2", refreshMutation.isPending && "animate-spin opacity-30")}/>
            </div>
        </Tooltip>
    );
};
