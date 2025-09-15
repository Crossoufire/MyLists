import {getRedoList} from "@/lib/utils/functions";
import {UpdateType} from "@/lib/server/utils/enums";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


interface RedoDropProps {
    name: string;
    redo: number | null;
    updateRedo: ReturnType<typeof useUpdateUserMediaMutation>
}


export const UpdateRedo = ({ name, redo, updateRedo }: RedoDropProps) => {
    const handleRedoChange = (redo: string) => {
        updateRedo.mutate({ payload: { redo: parseInt(redo), type: UpdateType.REDO } });
    };

    return (
        <div className="flex justify-between items-center">
            <div>{name}</div>
            <Select value={redo?.toString()} onValueChange={handleRedoChange} disabled={updateRedo?.isPending}>
                <SelectTrigger className="w-[130px] border-hidden px-0" size="sm">
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
