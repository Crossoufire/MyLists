import {getPlaytimeValues} from "@/utils/functions";
import {UseMutationResult} from "@tanstack/react-query";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const PlaytimeDrop = ({playtime, updatePlaytime}: PlaytimeDropProps) => {
    const playValues = getPlaytimeValues();
    const hoursPlaytime = playtime / 60;

    const handleSelect = (playtimeInHours: number) => {
        updatePlaytime.mutate({payload: playtimeInHours * 60});
    };

    return (
        <div className="flex justify-between items-center">
            <div>Playtime</div>
            <Select value={`${hoursPlaytime}`} onValueChange={handleSelect} disabled={updatePlaytime.isPending}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {playValues.map(play => <SelectItem key={play} value={`${play}`}>{play} hours</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
};


interface PlaytimeDropProps {
    playtime: number;
    updatePlaytime: UseMutationResult;
}