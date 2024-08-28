import {toast} from "sonner";
import {FaRedo} from "react-icons/fa";
import {formatDateTime} from "@/lib/utils";
import {useMutation} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {LoadingIcon} from "@/components/app/base/LoadingIcon";


export const RefreshMedia = ({ updateRefresh, mutateData, lastApiUpdate }) => {
    const [isLoading, handleLoading] = useMutation();
    const lastRefresh = lastApiUpdate ? formatDateTime(lastApiUpdate, { includeTime: true }) : "Never";

    const handleRefresh = async () => {
        const response = await handleLoading(updateRefresh);
        if (response) {
            await mutateData();
            toast.success("Media data successfully updated!");
        }
    };

    if (isLoading) {
        return <LoadingIcon size={6} cssOverride={{marginTop: 12}}/>;
    }

    return (
        <Tooltip text="Refresh metadata" subText={`Last refresh: ${lastRefresh}`} side="left">
            <div role="button" onClick={handleRefresh}>
                <FaRedo size={18} className="mt-2"/>
            </div>
        </Tooltip>
    );
};
