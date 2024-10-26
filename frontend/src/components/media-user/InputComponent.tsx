import {cn} from "@/utils/functions";
import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {UseMutationResult} from "@tanstack/react-query";


export const InputComponent = ({initValue, total, onUpdate, isEditable = true, containerClassName, inputClassName}: InputComponentProps) => {
    const [currentValue, setCurrentValue] = useState(initValue);

    useEffect(() => {
        setCurrentValue(initValue);
    }, [initValue]);

    const handleOnBlur = (ev) => {
        ev.preventDefault();
        if (currentValue === initValue) return;
        if (total !== undefined && (currentValue > total || currentValue < 0)) {
            return setCurrentValue(initValue);
        }
        onUpdate.mutate({payload: currentValue});
    };

    return (
        <div className={containerClassName}>
            {isEditable ?
                <Input
                    value={currentValue}
                    onBlur={handleOnBlur}
                    className={cn("text-base border-none bg-transparent cursor-pointer inline-block", inputClassName)}
                    disabled={onUpdate.isPending}
                    onChange={(ev) => setCurrentValue(ev.target.value)}
                />
                :
                <span>{initValue}</span>
            }
            {total && <span>{" "}/{" "}{total}</span>}
        </div>
    );
};


interface InputComponentProps {
    total?: number;
    initValue: number;
    isEditable?: boolean;
    inputClassName?: string;
    containerClassName?: string;
    onUpdate: UseMutationResult;
}