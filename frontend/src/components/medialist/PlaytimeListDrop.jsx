import {useEffect, useState} from "react";
import {getPlaytimeValues} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const PlaytimeListDrop = ({ isCurrent, initPlaytime, updatePlaytime }) => {
    const playValues = getPlaytimeValues();
    const [isLoading, handleLoading] = useLoading();
    const [playtime, setPlaytime] = useState(initPlaytime / 60);

    const handlePlaytime = async (value) => {
        const response = await handleLoading(updatePlaytime, value);
        if (response) {
            setPlaytime(value);
        }
    };

    return (
        <>
            {isCurrent ?
                <div className="h-[28px]">
                    <Select value={playtime} onValueChange={handlePlaytime} disabled={isLoading}>
                        <SelectTrigger size="list" variant="noIcon">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {playValues.map(p => <SelectItem key={p} value={p}>{p} hours</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                :
                <div className="h-[28px]">
                    <div>{playtime} hours</div>
                </div>
            }
        </>
    )
};
