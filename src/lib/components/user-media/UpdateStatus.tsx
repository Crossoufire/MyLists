import {MediaType, Status} from "@/lib/server/utils/enums";
import {useUpdateStatusMutation} from "@/lib/react-query/mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


interface StatusDropProps {
    status: Status;
    mediaType: MediaType;
    canBeCompleted?: boolean;
    updateStatus: ReturnType<typeof useUpdateStatusMutation>;
}


export const UpdateStatus = ({ status, mediaType, updateStatus, canBeCompleted = true }: StatusDropProps) => {
    const allStatuses = Status.byMediaType(mediaType);

    const handleStatus = (status: Status) => {
        updateStatus.mutate({ payload: { status } });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Status</div>
            <Select value={status} onValueChange={handleStatus} disabled={updateStatus?.isPending}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {allStatuses?.map(s => (
                        <SelectItem key={s} value={s} disabled={s === Status.COMPLETED && !canBeCompleted}>
                            {s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
