import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Pencil, RefreshCw} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {formatDateTime} from "@/lib/utils/functions";


interface RefreshAndEditMediaProps {
    mediaId: number;
    mediaType: MediaType;
    lastUpdate: string | null;
}


export const RefreshAndEditMedia = ({ mediaType, mediaId, lastUpdate }: RefreshAndEditMediaProps) => {
    // const refreshMutation = useRefreshMutation(queryKeys.detailsKey(mediaType, mediaId.toString()));
    const lastRefresh = lastUpdate ? formatDateTime(lastUpdate, { includeTime: true, useLocalTz: true }) : "Never";
    const toto = false;

    const handleRefresh = () => {
        // refreshMutation.mutate({ mediaType, mediaId }, {
        //     onError: () => toast.error("An error occurred while refreshing the mediadata"),
        //     onSuccess: () => toast.success("Mediadata successfully refreshed"),
        // });
    };

    return (
        <div className="flex items-center gap-3 mt-2">
            <Tooltip text="Refresh metadata" subText={`Last refresh: ${lastRefresh}`} side="left">
                <div role="button" onClick={handleRefresh}>
                    <RefreshCw size={18} className={cn("", toto && "animate-spin opacity-30")}/>
                </div>
            </Tooltip>
            {/*//@ts-expect-error*/}
            <Link to="/details/edit/$mediaType/$mediaId" params={{ mediaType, mediaId }}>
                <Pencil className="w-5 h-5"/>
            </Link>
        </div>
    );
};
