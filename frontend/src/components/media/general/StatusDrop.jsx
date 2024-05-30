import {useLoading} from "@/hooks/LoadingHook";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const StatusDrop = ({ status, allStatus, updateStatus, callbackStatus }) => {
    const [isLoading, handleLoading] = useLoading();

    const handleStatus = async (value) => {
        const response = await handleLoading(updateStatus, value);
        if (response) {
            callbackStatus(value);
        }
    };

    return (
        <div className="flex justify-between items-center">
            <div>Status</div>
            <Select value={status} onValueChange={handleStatus} disabled={isLoading}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {allStatus.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    )
};
