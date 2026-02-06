import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Pencil, RefreshCw} from "lucide-react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Button} from "@/lib/client/components/ui/button";
import {isAtLeastRole, MediaType, RoleType} from "@/lib/utils/enums";
import {formatDateTime, formatRelativeTime} from "@/lib/utils/formating";
import {useRefreshMediaMutation} from "@/lib/client/react-query/query-mutations/media.mutations";


interface RefreshAndEditProps {
    mediaId: number;
    external: boolean;
    mediaType: MediaType;
    apiId: number | string;
    lastUpdate: string | null;
}


export const RefreshAndEdit = ({ mediaType, mediaId, apiId, external, lastUpdate }: RefreshAndEditProps) => {
    const { currentUser } = useAuth();
    const isBook = (mediaType === MediaType.BOOKS);
    const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : null;
    const isManagerOrAbove = isAtLeastRole(currentUser?.role, RoleType.MANAGER);
    const refreshMutation = useRefreshMediaMutation(mediaType, external ? apiId : mediaId, external);

    if (!isManagerOrAbove && isBook) return null;

    // Logic Constants
    const isLastUpdateValid = lastUpdateDate && !isNaN(lastUpdateDate.getTime());
    const nextRefreshAt = isLastUpdateValid ? new Date(lastUpdateDate.getTime() + 24 * 60 * 60 * 1000) : null;

    // Managers can refresh anything. Others can refresh anything except books.
    const canRefreshThisType = isManagerOrAbove || !isBook;

    // Cooldown only applies to users below MANAGER
    const isRefreshCooldown = !isManagerOrAbove && !!nextRefreshAt && Date.now() < nextRefreshAt.getTime();

    // Check availability of refresh
    const refreshDisabled = refreshMutation.isPending || !currentUser || isRefreshCooldown;

    const refreshTitle = isRefreshCooldown && nextRefreshAt
        ? `Refresh available ${formatDateTime(nextRefreshAt.toISOString())}` : "Refresh metadata";

    const handleRefresh = () => {
        refreshMutation.mutate({ data: { mediaType, apiId } }, {
            onError: () => toast.error("An error occurred while refreshing the metadata"),
            onSuccess: () => toast.success("Metadata successfully refreshed"),
        });
    };

    return (
        <div className="flex items-center justify-center gap-4 rounded-lg border p-1 shadow-sm max-sm:gap-2" title={refreshTitle}>
            {canRefreshThisType &&
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRefresh}
                    disabled={refreshDisabled}
                    className="h-8 gap-2 px-3 text-xs"
                >
                    <RefreshCw className={cn("size-3.5", refreshMutation.isPending && "animate-spin")}/> Refresh
                </Button>
            }

            {canRefreshThisType && isManagerOrAbove &&
                <div className="h-6 border-l border border-muted-foreground/50"/>
            }

            {isManagerOrAbove &&
                <Button size="sm" variant="ghost" className="h-8 gap-2 px-3 text-xs" asChild>
                    <Link to="/details/edit/$mediaType/$mediaId" params={{ mediaType, mediaId }}>
                        <Pencil className="size-3.5"/> Edit
                    </Link>
                </Button>
            }

            {(canRefreshThisType || isManagerOrAbove) &&
                <div className="h-6 border-l border border-muted-foreground/50"/>
            }

            <div className="px-3 text-xs text-muted-foreground" title={formatDateTime(lastUpdate)}>
                Updated {formatRelativeTime(lastUpdate)}
            </div>
        </div>
    );
};
