import {useState} from "react";
import {getPlaytimeValues} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {LoadingIcon} from "@/components/app/base/LoadingIcon";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const PlaytimeListDrop = ({ isCurrent, initPlaytime, status, updatePlaytime }) => {
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
            {status === "Plan to Play" ?
                <div className="flex justify-around items-center h-[32px] w-full opacity-90 bg-gray-900 border
                border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
                    <div>{playtime} hours</div>
                </div>
                :
                isCurrent ?
                    <div className="flex justify-center items-center h-[32px] w-full opacity-90 bg-gray-900 border
                    border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
                        <Select value={isLoading ? undefined : playtime} onValueChange={handlePlaytime}
                                disabled={isLoading}>
                            <SelectTrigger className="w-36 text-base" size="list" variant="noIcon">
                                <SelectValue placeholder={<LoadingIcon size={5}/>}/>
                            </SelectTrigger>
                            <SelectContent>
                                {playValues.map(p => <SelectItem key={p} value={p}>{p} hours</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    :
                    <div className="flex justify-around items-center h-[32px] w-full opacity-90 bg-gray-900 border
                border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
                        <div>{playtime} hours</div>
                    </div>
            }
        </>
    )
};
