import {useState} from "react";
import {getPlaytimeValues} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const PlaytimeDrop = ({ initPlaytime, updatePlaytime }) => {
    const playValues = getPlaytimeValues();
    const [isLoading, handleLoading] = useLoading();
    const [playtime, setPlaytime] = useState(initPlaytime || "0");

    const handleSelect = async (value) => {
        const newVal = value;
        const response = await handleLoading(updatePlaytime, newVal);
        if (response) {
            setPlaytime(newVal);
        }
    };


    return (
        <div className="flex justify-between items-center">
            <div>Playtime</div>
            <Select value={isLoading ? undefined : playtime} onValueChange={handleSelect} disabled={isLoading}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue placeholder={<LoadingIcon size={6}/>}/>
                </SelectTrigger>
                <SelectContent>
                    {playValues.map(p => <SelectItem key={p} value={p}>{p} hours</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
};
