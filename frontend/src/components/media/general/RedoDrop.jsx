import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {getRedoValues} from "@/utils/functions";


export const RedoDrop = ({ name, redo, updateRedo }) => {
    const handleRedoChange = (redo) => {
        updateRedo.mutate({ payload: redo });
    };

    return (
        <div className="flex justify-between items-center">
            <div>{name}</div>
            <Select value={redo} onValueChange={handleRedoChange} disabled={updateRedo.isPending}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {getRedoValues().map(val =>
                        <SelectItem key={val} value={val}>{`${val}`}</SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    )
};
