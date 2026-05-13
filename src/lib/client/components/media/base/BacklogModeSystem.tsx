import {useRef} from "react";
import {cn} from "@/lib/utils/helpers";
import {Calendar, TriangleAlert} from "lucide-react";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {formatDateTime, toDateInputValue} from "@/lib/utils/formating";


interface BacklogModeBannerProps {
    date: string;
    enabled: boolean;
    disabled: boolean;
    onDateChange: (date: string) => void;
    onEnabledChange: (enabled: boolean) => void;
}


export const BacklogModeSystem = ({ enabled, date, disabled, onDateChange, onEnabledChange }: BacklogModeBannerProps) => {
    // eslint-disable-next-line @eslint-react/purity
    const today = toDateInputValue(new Date().toISOString());
    const dateInputRef = useRef<HTMLInputElement>(null);
    const selectedLabel = enabled && date ? formatDateTime(date, { noTime: true }) : "TODAY";

    const getPresetDate = (daysAgo: number) => {
        const preset = new Date();
        preset.setDate(preset.getDate() - daysAgo);

        return toDateInputValue(preset.toISOString());
    };

    const getPresetMonthDate = () => {
        const preset = new Date();
        preset.setMonth(preset.getMonth() - 1);

        return toDateInputValue(preset.toISOString());
    };

    const presets = [
        { label: "Today", value: today, enabled: false },
        { label: "-2d", value: getPresetDate(2), enabled: true },
        { label: "-1 wk.", value: getPresetDate(7), enabled: true },
        { label: "-1 mo.", value: getPresetMonthDate(), enabled: true },
    ];

    const selectDate = (value: string, shouldEnable: boolean) => {
        onDateChange(shouldEnable ? value : "");
        onEnabledChange(shouldEnable);
    };

    const openDatePicker = () => {
        const input = dateInputRef.current;
        if (!input) return;

        if ("showPicker" in input) {
            input.showPicker();
            return;
        }

        // @ts-expect-error - older browsers
        input.click();
    };

    const handleCustomDate = (value: string) => {
        const isToday = value === today;
        onDateChange(isToday ? "" : value);
        onEnabledChange(!!value && !isToday);
    };

    return (
        <div className="-mt-1 mb-5 space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Log for:{" "}
                <span className="text-app-accent">
                    {selectedLabel}
                </span>
            </div>

            <div className="relative grid w-full grid-cols-5 gap-1.5">
                {presets.map((preset) => {
                    const isSelected = preset.enabled ? enabled && date === preset.value : !enabled;

                    return (
                        <Button
                            size="sm"
                            key={preset.label}
                            disabled={disabled}
                            variant={isSelected ? "default" : "secondary"}
                            onClick={() => selectDate(preset.value, preset.enabled)}
                            className={cn("h-7 w-full text-xs", isSelected
                                ? "bg-app-accent text-black hover:bg-app-accent/90"
                                : "bg-background text-muted-foreground hover:bg-background/80",
                            )}
                        >
                            {preset.label}
                        </Button>
                    );
                })}

                <Button
                    size="icon"
                    disabled={disabled}
                    variant="secondary"
                    onClick={openDatePicker}
                    title="Choose backlog date"
                    className="h-7 w-full bg-background text-muted-foreground hover:bg-background/80"
                >
                    <Calendar className="size-4"/>
                </Button>

                <Input
                    type="date"
                    max={today}
                    tabIndex={-1}
                    ref={dateInputRef}
                    value={enabled ? date : today}
                    onChange={(ev) => handleCustomDate(ev.target.value)}
                    className="absolute inset-0 pointer-events-none h-0 w-0 border-none opacity-0"
                />
            </div>
            {selectedLabel !== "TODAY" &&
                <div className="pt-0.5 flex justify-center items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-app-rating">
                    <TriangleAlert className="size-4"/>
                    You are backlogging
                    <TriangleAlert className="size-4"/>
                </div>
            }
        </div>
    );
};
