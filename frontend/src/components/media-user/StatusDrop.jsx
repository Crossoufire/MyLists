import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const StatusDrop = ({ status, allStatus, updateStatus, canBeCompleted = true }) => {
    const handleStatus = (status) => {
        updateStatus.mutate({ payload: status });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Status</div>
            <Select value={status} onValueChange={handleStatus} disabled={updateStatus.isPending}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {allStatus.map(s => (
                        <SelectItem key={s} value={s} disabled={s === "Completed" && !canBeCompleted}>
                            {s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
