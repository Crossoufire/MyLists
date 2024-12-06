import {cn} from "@/utils/functions";
import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";


export const InputComponent = ({ initValue, total, onUpdate, isEditable = true, containerClassName, inputClassName }) => {
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
        onUpdate.mutate({ payload: currentValue });
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