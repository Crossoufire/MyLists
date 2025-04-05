import {Status} from "@/lib/server/utils/enums";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


interface StatusDropProps {
    updateStatus?: any;
    allStatus?: Status[];
    canBeCompleted?: boolean;
    status: Status | undefined;
}


export const UpdateStatus = ({ status, allStatus, updateStatus, canBeCompleted = true }: StatusDropProps) => {
    const handleStatus = (status: Status) => {
        updateStatus.mutate({ payload: status });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Status</div>
            <Select value={status} onValueChange={handleStatus} disabled={updateStatus?.isPending}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {allStatus?.map(s => (
                        <SelectItem key={s} value={s} disabled={s === "Completed" && !canBeCompleted}>
                            {s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
