import {Input} from "@/lib/components/ui/input";
import React, {useEffect, useState} from "react";
import {UpdateType} from "@/lib/server/utils/enums";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface UpdateInputProps {
    total: number | null;
    initValue: number | null;
    payloadName: "actualPage" | "currentChapter";
    updateInput: ReturnType<typeof useUpdateUserMediaMutation>;
    updateType: typeof UpdateType.PAGE | typeof UpdateType.CHAPTER;
}


export const UpdateInput = ({ total, initValue, updateInput, payloadName, updateType }: UpdateInputProps) => {
    const [currentValue, setCurrentValue] = useState<number>(initValue ?? 0);

    useEffect(() => {
        setCurrentValue(initValue ?? 0);
    }, [initValue]);

    const handleOnBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
        ev.preventDefault();
        if (currentValue === initValue) return;

        if (total !== undefined && total !== null && (currentValue > total || currentValue < 0)) {
            return setCurrentValue(initValue ?? 0);
        }

        updateInput.mutate({ payload: { [payloadName]: currentValue, type: updateType } });
    };

    return (
        <div className="w-[135px] text-sm">
            <Input
                value={currentValue}
                onBlur={handleOnBlur}
                disabled={updateInput.isPending}
                onChange={(ev) => setCurrentValue(parseInt(ev.target.value))}
                className="w-[50px] px-1 text-base border-none bg-transparent cursor-pointer inline-block"
            />
            <span>{" "}/{" "}{total ?? "?"}</span>
        </div>
    );
};
