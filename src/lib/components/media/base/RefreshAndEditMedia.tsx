import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Pencil, RefreshCw} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {formatRelativeTime} from "@/lib/utils/functions";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/components/ui/tooltip";
import {useRefreshMediaMutation} from "@/lib/react-query/query-mutations/media.mutations";


interface RefreshAndEditMediaProps {
    mediaId: number;
    external: boolean;
    mediaType: MediaType;
    apiId: number | string;
    lastUpdate: string | null;
}


export const RefreshAndEditMedia = ({ mediaType, mediaId, apiId, external, lastUpdate }: RefreshAndEditMediaProps) => {
    const refreshMutation = useRefreshMediaMutation(mediaType, external ? apiId : mediaId, external);

    const handleRefresh = () => {
        refreshMutation.mutate({ data: { mediaType, apiId } }, {
            onError: () => toast.error("An error occurred while refreshing the MediaData"),
            onSuccess: () => toast.success("MediaData successfully refreshed"),
        });
    };

    return (
        <div className="flex items-center gap-3 mt-2 opacity-80">
            <Tooltip>
                <TooltipTrigger onClick={handleRefresh}>
                    <RefreshCw className={cn("size-4", refreshMutation.isPending && "animate-spin opacity-30")}/>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <div>Refresh Metadata</div>
                    <div>Last Refresh: {formatRelativeTime(lastUpdate)}</div>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link to="/details/edit/$mediaType/$mediaId" params={{ mediaType, mediaId }}>
                        <Pencil className="size-4"/>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    Edit Details
                </TooltipContent>
            </Tooltip>
        </div>
    );
};
