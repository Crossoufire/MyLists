import {useState} from "react";
import {getRedoValues} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {LoadingIcon} from "@/components/app/base/LoadingIcon";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RedoDrop = ({ name, initRedo, updateRedo }) => {
    const redoValues = getRedoValues();
    const [isLoading, handleLoading] = useLoading();
    const [redo, setRedo] = useState(initRedo || 0);

    const handleRedo = async (value) => {
        const response = await handleLoading(updateRedo, value);
        if (response) {
            setRedo(value);
        }
    };

    return (
        <div className="flex justify-between items-center">
            <div>{name}</div>
            <Select value={isLoading ? undefined : redo} onValueChange={handleRedo} disabled={isLoading}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue placeholder={<LoadingIcon size={6}/>}/>
                </SelectTrigger>
                <SelectContent>
                    {redoValues.map(val => <SelectItem key={val} value={val}>{`${val}`}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    )
};
