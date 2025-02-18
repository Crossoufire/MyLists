import {toast} from "sonner";
import {queryKeys} from "@/api";
import {Link} from "@tanstack/react-router";
import {Pencil, RefreshCw} from "lucide-react";
import {Tooltip} from "@/components/ui/tooltip";
import {formatDateTime} from "@/utils/functions";
import {useRefreshMutation} from "@/api/mutations";


export const RefreshAndEditMedia = ({ mediaType, mediaId, lastUpdate }) => {
    const refreshMutation = useRefreshMutation(queryKeys.detailsKey(mediaType, mediaId.toString()));
    const lastRefresh = lastUpdate ? formatDateTime(lastUpdate, { includeTime: true, useLocalTz: true }) : "Never";

    const handleRefresh = () => {
        refreshMutation.mutate({ mediaType, mediaId }, {
            onError: () => toast.error("An error occurred while refreshing the mediadata"),
            onSuccess: () => toast.success("Mediadata successfully refreshed"),
        });
    };

    return (
        <div className="flex items-center gap-3 mt-2">
            <Tooltip text="Refresh metadata" subText={`Last refresh: ${lastRefresh}`} side="left">
                <div role="button" onClick={handleRefresh}>
                    <RefreshCw size={18} className={refreshMutation.isPending && "animate-spin opacity-30"}/>
                </div>
            </Tooltip>
            <Link to={`/details/edit/${mediaType}/${mediaId}`}>
                <Pencil className="w-5 h-5"/>
            </Link>
        </div>
    );
};
