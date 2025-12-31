import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {Pencil, RefreshCw} from "lucide-react";
import {formatRelativeTime} from "@/lib/utils/functions";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/client/components/ui/tooltip";
import {useRefreshMediaMutation} from "@/lib/client/react-query/query-mutations/media.mutations";


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
        <div className="flex items-center gap-6 opacity-80">
            <Tooltip>
                <TooltipTrigger className="flex items-center text-xs gap-2 hover:text-app-accent" onClick={handleRefresh}>
                    <RefreshCw className={cn("size-4", refreshMutation.isPending && "animate-spin opacity-30")}/>
                    Refresh
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                    <div>Refresh Metadata</div>
                    <div>Last Refresh: {formatRelativeTime(lastUpdate)}</div>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger className="flex items-center text-xs gap-2 hover:text-app-accent" asChild>
                    <Link to="/details/edit/$mediaType/$mediaId" params={{ mediaType, mediaId }}>
                        <div className="flex items-center gap-2">
                            <Pencil className="size-4"/>
                            Edit
                        </div>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    Edit Details
                </TooltipContent>
            </Tooltip>
        </div>
    );
};
