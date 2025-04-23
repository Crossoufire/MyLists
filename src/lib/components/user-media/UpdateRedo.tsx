import {getRedoList} from "@/lib/utils/functions";
import {useUpdateRedoMutation} from "@/lib/react-query/mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


interface RedoDropProps {
    name: string;
    redo: number | null;
    updateRedo: ReturnType<typeof useUpdateRedoMutation>
}


export const UpdateRedo = ({ name, redo, updateRedo }: RedoDropProps) => {
    const handleRedoChange = (redo: string) => {
        updateRedo.mutate({ payload: { redo: parseInt(redo) } });
    };

    return (
        <div className="flex justify-between items-center">
            <div>{name}</div>
            <Select value={redo?.toString()} onValueChange={handleRedoChange} disabled={updateRedo?.isPending}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {getRedoList().map(val =>
                        <SelectItem key={val} value={val.toString()}>
                            {`${val}`}
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
