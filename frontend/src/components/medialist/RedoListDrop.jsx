import {useState} from "react";
import {getRedoValues} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RedoListDrop = ({ isCurrent, initRedo, updateRedo }) => {
    const redoValues = getRedoValues();
    const [isLoading, handleLoading] = useLoading();
    const [redo, setRedo] = useState(initRedo || 0);

    const selectChange = async (value) => {
        const newVal = value;
        const response = await handleLoading(updateRedo, newVal);
        if (response) {
            setRedo(newVal);
        }
    };

    return (
        <>
            {isCurrent ?
                <Select value={isLoading ? undefined : `${redo}`} onValueChange={selectChange} disabled={!isCurrent || isLoading}>
                    <Tooltip text="Redo" offset={4}>
                        <SelectTrigger className="w-[20px]" size="list" variant="noIcon">
                            <SelectValue placeholder={<LoadingIcon size={6}/>}/>
                        </SelectTrigger>
                    </Tooltip>
                    <SelectContent align="center">
                        {redoValues.map(val => <SelectItem key={val} value={`${val}`}>{`${val}`}</SelectItem>)}
                    </SelectContent>
                </Select>
                :
                <Tooltip text="Redo" offset={4}>
                    <span>{redo}</span>
                </Tooltip>
            }
        </>
    );
};
