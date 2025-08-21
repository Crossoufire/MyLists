import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Pencil, RefreshCw} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {formatDateTime} from "@/lib/utils/functions";
import {useRefreshMediaMutation} from "@/lib/react-query/query-mutations/media.mutations";


interface RefreshAndEditMediaProps {
    apiId: number;
    mediaId: number;
    mediaType: MediaType;
    lastUpdate: string | null;
}


export const RefreshAndEditMedia = ({ mediaType, mediaId, apiId, lastUpdate }: RefreshAndEditMediaProps) => {
    const refreshMutation = useRefreshMediaMutation(mediaType, mediaId);
    const lastRefresh = lastUpdate ? formatDateTime(lastUpdate, { includeTime: true, useLocalTz: true }) : "Never";

    const handleRefresh = () => {
        refreshMutation.mutate({ data: { mediaType, apiId } }, {
            onError: () => toast.error("An error occurred while refreshing the MediaData"),
            onSuccess: () => toast.success("MediaData successfully refreshed"),
        });
    };

    return (
        <div className="flex items-center gap-3 mt-2">
            <Tooltip text="Refresh metadata" subText={`Last refresh: ${lastRefresh}`} side="left">
                <div role="button" onClick={handleRefresh}>
                    <RefreshCw
                        size={18}
                        className={cn("", refreshMutation.isPending && "animate-spin opacity-30")}
                    />
                </div>
            </Tooltip>
            <Link to="/details/edit/$mediaType/$mediaId" params={{ mediaType, mediaId }}>
                <Pencil className="w-5 h-5"/>
            </Link>
        </div>
    );
};
