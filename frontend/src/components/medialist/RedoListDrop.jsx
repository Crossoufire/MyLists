import {LuRotateCw} from "react-icons/lu";
import {getRedoValues} from "@/utils/functions.jsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RedoListDrop = ({ isCurrent, redo, updateRedo }) => {
    const redoValues = getRedoValues();

    const selectChange = async (redo) => {
        await updateRedo.mutateAsync({ payload: redo });
    };

    return (
        <div className="flex items-center gap-2" title="Redo">
            <LuRotateCw/>
            {isCurrent ?
                <Select value={`${redo}`} onValueChange={selectChange} disabled={updateRedo.isPending}>
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
