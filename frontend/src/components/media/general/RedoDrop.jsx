import {getRedoValues} from "@/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RedoDrop = ({ name, redo, updateRedo }) => {
    const handleRedoChange = async (redo) => {
        await updateRedo.mutateAsync({ payload: redo });
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
