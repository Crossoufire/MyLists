/** parse a date string or number (s not ms!) into a Date object **/
const dateFromUTCInput = (input: string | number) => {
    if (typeof input === "number") {
        return new Date(input * 1000);
    }

    const str = input.trim();

    // "YYYY"
    if (/^\d{4}$/.test(str)) {
        return new Date(`${str}-01-01T00:00:00Z`);
    }

    // "YYYY-MM"
    if (/^\d{4}-\d{2}$/.test(str)) {
        return new Date(`${str}-01T00:00:00Z`);
    }

    // "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return new Date(`${str}T00:00:00Z`);
    }

    // DateTimes with spaces ("2026-05-31 15:00:00")
    let normalized = str.replace(" ", "T");

    // Time but no explicit timezone, force UTC with 'Z'
    const hasTimezone = /([Zz]|[+-]\d{2}:?\d{2})$/.test(normalized);
    if (normalized.includes("T") && !hasTimezone) {
        normalized += "Z";
    }

    return new Date(normalized);
};


/** returns a plain date string in the format: "2024-05-20" or null **/
export const formatDateForDb = (value: number | string | null | undefined) => {
    if (!value) return null;

    const date = dateFromUTCInput(value);
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0];
};


/** entry format is 'YYYY-MM-DD', returns an object with year, month and day strings **/
export const extractDate = (input?: string | null) => {
    const year = input?.split("-")?.[0] ?? "-";
    const month = input?.split("-")?.[1] ?? "-";
    const day = input?.split("-")?.[2] ?? "-";
    return { year, month, day };
};


/** entry format is 'YYYY-MM-DD', returns a year string or "-" **/
export const extractYear = (date?: string | null) => {
    return extractDate(date).year;
};


/** returns a plain date string in the format: "Jan 1, 2024" or "-" **/
export const formatDate = (value: string | number | null | undefined) => {
    if (!value) return "-";

    const date = dateFromUTCInput(value);
    if (isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    }).format(date);
}


/** @returns relative time string from today to the given date (local time) **/
export const formatRelativeTime = (input: string | number | null | undefined, opts: Intl.RelativeTimeFormatOptions = {}) => {
    if (!input) return { diffDays: null, relativeTime: "never" } as const;

    const utcDate = dateFromUTCInput(input);
    if (isNaN(utcDate.getTime())) return { diffDays: null, relativeTime: "never" } as const;

    const today = new Date();
    const todayMidnight = new Date(
        today.getFullYear(), today.getMonth(), today.getDate(),
        today.getHours(), today.getMinutes(), today.getSeconds(),
    );
    const utcMidnight = new Date(
        utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate(),
        utcDate.getHours(), utcDate.getMinutes(), utcDate.getSeconds(),
    );

    const diffSeconds = Math.round((utcMidnight.getTime() - todayMidnight.getTime()) / 1000);

    const THRESHOLDS: { max: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
        { max: 60, divisor: 1, unit: "second" },
        { max: 3600, divisor: 60, unit: "minute" },
        { max: 86400, divisor: 3600, unit: "hour" },
        { max: 604800, divisor: 86400, unit: "day" },
        { max: 2592000, divisor: 604800, unit: "week" },
        { max: 31536000, divisor: 2592000, unit: "month" },
        { max: Infinity, divisor: 31536000, unit: "year" },
    ];

    const absDiff = Math.abs(diffSeconds);
    const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "short", ...opts });
    const rule = THRESHOLDS.find((t) => absDiff < t.max) || THRESHOLDS[THRESHOLDS.length - 1];

    return {
        diffDays: diffSeconds / (60 * 60 * 24),
        relativeTime: rtf.format(Math.round(diffSeconds / rule.divisor), rule.unit),
    } as const;
};


// ----------------------------------------------------------------------------------------------------


const dateInputValueToUtcDate = (value: string) => {
    return new Date(`${value}T00:00:00.000Z`);
};


const withFallback = <T>(value: T | null | undefined, formatter: (v: T) => string, fallback = "-") => {
    return ((value === null) || (value === undefined) || (value === ""))
        ? fallback
        : formatter(value);
};


interface FmtOptions {
    noTime?: boolean;
    seconds?: boolean;
    onlyYear?: boolean;
}


export const formatDateTime = (value: string | number | null | undefined, opts: FmtOptions = {}) => {
    return withFallback(value, (input) => {
        const date = dateFromUTCInput(input);
        if (isNaN(date.getTime())) return "-";

        const { noTime, seconds, onlyYear } = opts;
        const dtfOptions: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: onlyYear ? undefined : "short",
            day: onlyYear ? undefined : "numeric",
            hour: noTime || onlyYear ? undefined : "numeric",
            minute: noTime || onlyYear ? undefined : "numeric",
            second: seconds ? "numeric" : undefined,
            hour12: false,
        };

        return new Intl.DateTimeFormat("en-US", dtfOptions).format(date);
    });
};


export const getMonthName = (month: string | number, opts: Intl.DateTimeFormatOptions = {}) => {
    if (!isNaN(Number(month))) {
        return new Date(0, Number(month) - 1).toLocaleString("en", { month: "long", ...opts });
    }

    return month;
};


export const formatMonthYear = (value: string) => {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1);

    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};


export const toDateInputValue = (value?: string | Date) => {
    if (!value) return "";

    const date = value instanceof Date
        ? value
        : new Date(value.includes(" ") ? `${value.replace(" ", "T")}Z` : value);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


export const dateInputValueToDate = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
};


export const isDateInputValue = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = dateInputValueToUtcDate(value);

    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};


export const isPastOrTodayDateInputValue = (value: string) => {
    return dateInputValueToUtcDate(value).getTime() <= Date.now();
};


export const toDateTimeAttribute = (value: string | number | null | undefined) => {
    if (!value) return undefined;

    const date = dateFromUTCInput(value);
    if (isNaN(date.getTime())) return undefined;

    return date.toISOString();
};
