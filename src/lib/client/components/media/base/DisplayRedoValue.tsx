import {RotateCw} from "lucide-react";


interface DisplayRedoValueProps {
    size?: number;
    redoValue: number | null;
}


export const DisplayRedoValue = ({ redoValue, size = 15 }: DisplayRedoValueProps) => {
    return (
        <div className="flex items-center gap-x-1">
            <RotateCw className="text-green-500" size={size}/>
            <div>{redoValue ?? 0}</div>
        </div>
    );
};