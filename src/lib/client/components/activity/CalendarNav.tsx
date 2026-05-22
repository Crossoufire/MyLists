import {useMemo} from "react";


interface CalendarNavProps {
    dates: { year: number, month: number };
    onChange: (year: number, month: number) => void;
}


const START_YEAR = 2026;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


export function CalendarNav({ onChange, dates }: CalendarNavProps) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const years = useMemo(() => {
        const yrs = [];
        for (let y = START_YEAR; y <= currentYear; y += 1) {
            yrs.push(y);
        }
        return yrs;
    }, [currentYear]);

    const handleSelect = (year: number, month: number) => {
        onChange(year, month);
    };

    const isFuture = (year: number, monthIdx: number) => {
        const monthNum = monthIdx + 1;
        if (year > currentYear) return true;
        return year === currentYear && monthNum > currentMonth;
    };

    return (
        <div className="h-full shrink-0 w-70 rounded-lg border border-border bg-card p-2 shadow-sm max-sm:w-full">
            <div className="mb-2 flex flex-wrap gap-1 border-b border-border pb-2">
                {years.map((year) =>
                    <button
                        key={year}
                        onClick={() => {
                            const newMonth = isFuture(year, dates.month - 1) ? currentMonth : dates.month;
                            handleSelect(year, newMonth);
                        }}
                        className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            dates.year === year ? "bg-app-accent text-background"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                    >
                        {year}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-6 gap-1">
                {months.map((month, index) => {
                    const active = dates.month === index + 1;
                    const disabled = isFuture(dates.year, index);

                    return (
                        <button
                            key={month}
                            disabled={disabled}
                            onClick={() => handleSelect(dates.year, index + 1)}
                            className={`flex h-7 items-center justify-center rounded text-[11px] font-medium transition-all ${
                                active
                                    ? "bg-app-accent/20 text-app-accent ring-1 ring-app-accent/50"
                                    : disabled ? "cursor-default opacity-20"
                                        : "cursor-pointer text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                        >
                            {month}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
