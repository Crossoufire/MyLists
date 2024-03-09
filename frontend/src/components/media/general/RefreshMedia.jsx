import {toast} from "sonner";
import {FaRedo} from "react-icons/fa";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";
import {createLocalDate} from "@/lib/utils.jsx";


export const RefreshMedia = ({ updateRefresh, mutateData, lastUpdate }) => {
    const [isLoading, handleLoading] = useLoading();

    const handleRefresh = async () => {
        const response = await handleLoading(updateRefresh);
        if (response) {
            await mutateData();
            toast.success("Media data successfully updated!");
        }
    };

    return (
        <>
            {isLoading ?
                <LoadingIcon size={8} cssOverride={{marginTop: 12}}/>
                :
                <Tooltip text="Refresh metadata" subText={`Last refresh: ${createLocalDate(lastUpdate)}`} side="left">
                    <div role="button" onClick={handleRefresh}>
                        <FaRedo size={18} className="mt-2"/>
                    </div>
                </Tooltip>
            }
        </>
    );
};
