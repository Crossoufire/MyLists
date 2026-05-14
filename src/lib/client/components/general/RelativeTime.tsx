import {cn} from "@/lib/utils/helpers";
import {formatDateTime, formatRelativeTime} from "@/lib/utils/formating";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";


interface RelativeTimeProps {
    prefix?: string;
    className?: string;
    value: string | number | null | undefined;
}


const toDateTimeAttribute = (value: string | number | null | undefined) => {
    if (!value) return undefined;

    const date = typeof value === "number"
        ? new Date(value * 1000) : new Date(value.includes(" ")
            ? `${value.replace(" ", "T")}Z`
            : value);

    if (isNaN(date.getTime())) return undefined;

    return date.toISOString();
};


export function RelativeTime({ value, className, prefix }: RelativeTimeProps) {
    const dateTime = formatDateTime(value);
    const relativeTime = formatRelativeTime(value);
    const dateTimeAttribute = toDateTimeAttribute(value);
    const readableDateTime = dateTime === "-" ? relativeTime : dateTime;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={dateTime === "-" ? relativeTime : `${relativeTime}, ${dateTime}`}
                    className={cn("inline-flex w-fit cursor-help appearance-none rounded-sm bg-transparent p-0 " +
                        "text-left align-baseline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2",
                        className
                    )}
                >
                    <time dateTime={dateTimeAttribute}>
                        {prefix}{relativeTime}
                    </time>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto px-3 py-2 text-xs" side="top">
                {readableDateTime}
            </PopoverContent>
        </Popover>
    );
}
