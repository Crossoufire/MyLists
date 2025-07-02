import {RotateCw} from "lucide-react";


interface DisplayRedoValueProps {
    redoValue: number | null;
}


export const DisplayRedoValue = ({ redoValue }: DisplayRedoValueProps) => {
    return (
        <div className="flex items-center gap-x-2">
            <RotateCw size={15} className="text-green-500"/>
            <div>{redoValue ?? 0}</div>
        </div>
    );
};