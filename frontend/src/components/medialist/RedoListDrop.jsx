import {useState} from "react";
import {LuRotateCw} from "react-icons/lu";
import {getRedoValues} from "@/lib/utils";
import {useMutation} from "@/hooks/LoadingHook";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RedoListDrop = ({ isCurrent, initRedo, updateRedo, isDisabled = false }) => {
    const redoValues = getRedoValues();
    const [isLoading, handleLoading] = useMutation();
    const [redo, setRedo] = useState(initRedo || 0);

    const selectChange = async (value) => {
        const newVal = value;
        const response = await handleLoading(updateRedo, newVal);
        if (response) {
            setRedo(newVal);
        }
    };

    return (
        <div className="flex items-center gap-2" title="Redo">
            <LuRotateCw/>
            {isCurrent ?
                <Select value={`${redo}`} onValueChange={selectChange} disabled={isLoading || isDisabled}>
                    <SelectTrigger className="w-[20px]" size="list" variant="noIcon">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent align="center">
                        {redoValues.map(val => <SelectItem key={val} value={`${val}`}>{`${val}`}</SelectItem>)}
                    </SelectContent>
                </Select>
                :
                <span>{redo}</span>
            }
        </div>
    );
};
