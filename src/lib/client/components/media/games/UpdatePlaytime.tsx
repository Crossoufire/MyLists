import {UpdateType} from "@/lib/utils/enums";
import {getPlaytimeList} from "@/lib/utils/functions";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


interface UpdatePlaytimeProps {
    playtime: number;
    updatePlaytime: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdatePlaytime = ({ playtime, updatePlaytime }: UpdatePlaytimeProps) => {
    const hoursPlaytime = playtime / 60;

    const handleSelect = (playtimeInHours: string) => {
        updatePlaytime.mutate({ payload: { playtime: parseInt(playtimeInHours) * 60, type: UpdateType.PLAYTIME } });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Playtime</div>
            <Select value={hoursPlaytime.toString()} onValueChange={handleSelect} disabled={updatePlaytime.isPending}>
                <SelectTrigger className="w-[130px] border-hidden px-0" size="sm">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {getPlaytimeList().map(val =>
                        <SelectItem key={val} value={`${val}`}>
                            {val} hours
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
