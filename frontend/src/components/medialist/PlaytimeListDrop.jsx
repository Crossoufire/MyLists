import {getPlaytimeValues} from "@/utils/functions.jsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const PlaytimeListDrop = ({ isCurrent, playtime, updatePlaytime, className = "" }) => {
    const playValues = getPlaytimeValues();
    const hoursPlaytime = playtime / 60;

    const handlePlaytime = (playtimeInHours) => {
        updatePlaytime.mutate({ payload: playtimeInHours * 60 });
    };

    return (
        <>
            {isCurrent ?
                <div className={className}>
                    <Select value={`${hoursPlaytime}`} onValueChange={handlePlaytime} disabled={updatePlaytime.isPending}>
                        <SelectTrigger size="list" variant="noIcon">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {playValues.map(play => <SelectItem key={play} value={`${play}`}>{play} hours</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                :
                <div className="h-[28px]">
                    <div>{hoursPlaytime} hours</div>
                </div>
            }
        </>
    );
};
