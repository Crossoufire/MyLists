import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {Pencil, RefreshCw} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {formatDateTime, formatRelativeTime} from "@/lib/utils/formating";
import {useRefreshMediaMutation} from "@/lib/client/react-query/query-mutations/media.mutations";


interface RefreshAndEditProps {
    mediaId: number;
    external: boolean;
    mediaType: MediaType;
    apiId: number | string;
    lastUpdate: string | null;
    lockStatus: boolean | null;
}


export const RefreshAndEdit = ({ mediaType, mediaId, apiId, external, lastUpdate, lockStatus }: RefreshAndEditProps) => {
    const refreshMutation = useRefreshMediaMutation(mediaType, external ? apiId : mediaId, external);

    const handleRefresh = () => {
        if (lockStatus) return;
        refreshMutation.mutate({ data: { mediaType, apiId } }, {
            onError: () => toast.error("An error occurred while refreshing the metadata"),
            onSuccess: () => toast.success("Metadata successfully refreshed"),
        });
    };

    return (
        <div className="flex justify-center items-center gap-4 rounded-lg border p-1 shadow-sm max-sm:gap-2">
            <div title={lockStatus ? "Media locked and cannot be refreshed" : ""}>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    className="h-8 gap-2 px-3 text-xs"
                    disabled={refreshMutation.isPending || !!lockStatus}
                >
                    <RefreshCw className={cn("size-3.5", refreshMutation.isPending && "animate-spin")}/>
                    Refresh
                </Button>
            </div>

            <div className="border-l border h-6 border-muted-foreground/50"/>

            <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 text-xs" asChild>
                <Link to="/details/edit/$mediaType/$mediaId" params={{ mediaType, mediaId }}>
                    <Pencil className="size-3.5"/>
                    Edit
                </Link>
            </Button>

            <div className="border-l border h-6 border-muted-foreground/50"/>

            <div className="px-3 text-xs text-muted-foreground" title={formatDateTime(lastUpdate)}>
                Updated {formatRelativeTime(lastUpdate)}
            </div>
        </div>
    );
};
