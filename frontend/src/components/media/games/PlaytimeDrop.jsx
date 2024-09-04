import {getPlaytimeValues} from "@/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const PlaytimeDrop = ({ playtime, updatePlaytime }) => {
    const playValues = getPlaytimeValues();
    const hoursPlaytime = playtime / 60;

    const handleSelect = async (playtimeInHours) => {
        updatePlaytime.mutate({ payload: playtimeInHours * 60 });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Playtime</div>
            <Select value={hoursPlaytime} onValueChange={handleSelect} disabled={updatePlaytime.isPending}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {playValues.map(p => <SelectItem key={p} value={p}>{p} hours</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
};
