/** parse a date string or number (s not ms!) into a Date object **/
export const dateFromUTCInput = (input: string | number) => {
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


/** @returns relative time string from now to the given timestamp **/
export const formatRelativeTime = (input: string | number | null | undefined, opts: Intl.RelativeTimeFormatOptions = {}) => {
    if (!input) return "never";

    const utcDate = dateFromUTCInput(input);
    if (isNaN(utcDate.getTime())) return "never";

    const diffSeconds = Math.round((utcDate.getTime() - Date.now()) / 1000);

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

    return rtf.format(Math.round(diffSeconds / rule.divisor), rule.unit);
};


/** @returns whole-day relative time from today to the given calendar date **/
export const formatCalendarRelativeDate = (input: string | null | undefined, opts: Intl.RelativeTimeFormatOptions = {}) => {
    if (!input) return { diffDays: null, relativeTime: "never" } as const;

    const ymd = extractDate(input);
    const date = new Date(Number(ymd.year), Number(ymd.month) - 1, Number(ymd.day));
    if (!date || isNaN(date.getTime())) return { diffDays: null, relativeTime: "never" } as const;

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((date.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    const absDiff = Math.abs(diffDays);
    const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "short", ...opts });

    if (absDiff < 7) return { diffDays, relativeTime: rtf.format(diffDays, "day") } as const;
    if (absDiff < 30) return { diffDays, relativeTime: rtf.format(Math.round(diffDays / 7), "week") } as const;
    if (absDiff < 365) return { diffDays, relativeTime: rtf.format(Math.round(diffDays / 30), "month") } as const;

    return { diffDays, relativeTime: rtf.format(Math.round(diffDays / 365), "year") } as const;
};


/** @returns month name from the given month number or string **/
export const formatMonth = (month: string | number, opts: Intl.DateTimeFormatOptions = {}) => {
    return isNaN(+month) ? month : new Date(0, +month - 1).toLocaleString("en-US", { month: "long", ...opts });
}


/** @returns month year from the given date string 'YYYY-MM' **/
export const formatMonthYear = (value: string, opts: Intl.DateTimeFormatOptions = {}) => {
    const ymd = extractDate(value);
    const date = new Date(Number(ymd.year), Number(ymd.month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric", ...opts });
};


/** @returns 'YYYY-MM-DD' calendar string from date object or string **/
export const toDateInputValue = (value?: string | Date) => {
    if (!value) return "";

    const date = value instanceof Date ? value : dateFromUTCInput(value);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


/** @returns a date from a 'YYYY-MM-DD' string **/
export const dateInputValueToDate = (value: string) => {
    const ymd = extractDate(value);
    return new Date(Number(ymd.year), Number(ymd.month) - 1, Number(ymd.day));
};


/** @returns an ISO date string **/
export const toDateTimeAttribute = (value: string | number | null | undefined) => {
    if (!value) return undefined;

    const date = dateFromUTCInput(value);
    if (isNaN(date.getTime())) return undefined;

    return date.toISOString();
};


interface FmtOptions {
    seconds?: boolean;
    onlyYear?: boolean;
}


/** @returns a date string human formatted or "-" **/
export const formatDateTime = (value: string | number | null | undefined, opts: FmtOptions = {}) => {
    if (!value) return "-";

    const date = dateFromUTCInput(value);
    if (isNaN(date.getTime())) return "-";

    const { seconds, onlyYear } = opts;
    const dtfOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: onlyYear ? undefined : "short",
        day: onlyYear ? undefined : "numeric",
        second: seconds ? "numeric" : undefined,
        hour12: false,
    };

    return new Intl.DateTimeFormat("en-US", dtfOptions).format(date);
};
