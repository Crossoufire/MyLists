import {UpdateType} from "@/lib/utils/enums";
import {Input} from "@/lib/client/components/ui/input";
import {KeyboardEvent, useEffect, useState} from "react";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface UpdatePlaytimeProps {
    playtime: number;
    updatePlaytime: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdatePlaytime = ({ playtime, updatePlaytime }: UpdatePlaytimeProps) => {
    const maxPlaytimeHours = 15000;
    const hoursPlaytime = playtime / 60;
    const [currentValue, setCurrentValue] = useState(hoursPlaytime.toString());

    useEffect(() => {
        setCurrentValue(hoursPlaytime.toString());
    }, [hoursPlaytime]);

    const validateAndMutate = () => {
        if (currentValue.trim() === "") {
            setCurrentValue(hoursPlaytime.toString());
            return;
        }

        const parsed = Number(currentValue);
        if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
            setCurrentValue(hoursPlaytime.toString());
            return;
        }

        if (parsed < 0 || parsed > maxPlaytimeHours) {
            setCurrentValue(hoursPlaytime.toString());
            return;
        }

        if (Math.abs(parsed - hoursPlaytime) < 0.0001) return;

        updatePlaytime.mutate({ payload: { playtime: Math.round(parsed * 60), type: UpdateType.PLAYTIME } });
    };

    const handleOnBlur = () => {
        validateAndMutate();
    };

    const handleOnKeyDown = (ev: KeyboardEvent<HTMLInputElement>) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            ev.currentTarget.blur();

            validateAndMutate();
        }
    };

    return (
        <div className="flex justify-between items-center">
            <div>Playtime (h)</div>
            <Input
                min={0}
                step={1}
                type="number"
                inputMode="numeric"
                value={currentValue}
                onBlur={handleOnBlur}
                max={maxPlaytimeHours}
                onKeyDown={handleOnKeyDown}
                className="w-34 h-8 text-sm"
                disabled={updatePlaytime.isPending}
                onChange={(ev) => setCurrentValue(ev.target.value)}
            />
        </div>
    );
};
