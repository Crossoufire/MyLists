import {cn} from "@/lib/utils/helpers";
import {Input} from "@/lib/components/ui/input";
import React, {useEffect, useState} from "react";
import {UpdateType} from "@/lib/server/utils/enums";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface UpdateInputProps {
    total: number | null;
    isEditable?: boolean;
    inputClassName?: string;
    initValue: number | null;
    containerClassName?: string;
    updateInput: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdateInput = ({ total, inputClassName, containerClassName, initValue, updateInput, isEditable = true }: UpdateInputProps) => {
    const [currentValue, setCurrentValue] = useState<number>(initValue ?? 0);

    useEffect(() => {
        setCurrentValue(initValue ?? 0);
    }, [initValue]);

    const handleOnBlur = (ev: any) => {
        ev.preventDefault();
        if (currentValue === initValue) return;
        if (total !== undefined && total !== null && (currentValue > total || currentValue < 0)) {
            return setCurrentValue(initValue ?? 0);
        }
        updateInput.mutate({ payload: { actualPage: currentValue, type: UpdateType.PAGE } });
    };

    return (
        <div className={containerClassName}>
            {isEditable ?
                <Input
                    value={currentValue}
                    onBlur={handleOnBlur}
                    disabled={updateInput.isPending}
                    onChange={(ev) => setCurrentValue(parseInt(ev.target.value))}
                    className={cn("text-base border-none bg-transparent cursor-pointer inline-block", inputClassName)}
                />
                :
                <span>{initValue}</span>
            }
            <span>{" "}/{" "}{total ?? "?"}</span>
        </div>
    );
};
