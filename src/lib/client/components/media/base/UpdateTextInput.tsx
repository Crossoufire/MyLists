import {UpdateType} from "@/lib/utils/enums";
import React, {useEffect, useState} from "react";
import {Input} from "@/lib/client/components/ui/input";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface UpdateTextInputProps {
    initValue: string | null;
    payloadName: "language" | "publisher";
    updateInput: ReturnType<typeof useUpdateUserMediaMutation>;
    updateType: typeof UpdateType.LANGUAGE | typeof UpdateType.PUBLISHER;
}


export const UpdateTextInput = ({ initValue, payloadName, updateInput, updateType }: UpdateTextInputProps) => {
    const [currentValue, setCurrentValue] = useState(initValue ?? "");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect,@eslint-react/set-state-in-effect
        setCurrentValue(initValue ?? "");
    }, [initValue]);

    const validateAndMutate = () => {
        const value = currentValue.trim();
        const nextValue = value || null;

        if (nextValue === (initValue ?? null)) return;

        updateInput.mutate({
            payload: {
                type: updateType,
                [payloadName]: nextValue,
            },
        });
    };

    const handleOnBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
        ev.preventDefault();
        validateAndMutate();
    };

    const handleOnKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            ev.currentTarget.blur();
            validateAndMutate();
        }
    };

    return (
        <Input
            value={currentValue}
            onBlur={handleOnBlur}
            onKeyDown={handleOnKeyDown}
            disabled={updateInput.isPending}
            className="h-8 w-44 cursor-pointer dark:bg-transparent"
            onChange={(ev) => setCurrentValue(ev.target.value)}
        />
    );
};
