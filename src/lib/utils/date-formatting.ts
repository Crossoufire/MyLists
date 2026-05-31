const RELATIVE_TIME_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
];

const parseDate = (input: string | number) => {
    if (typeof input === "number") {
        return new Date(input * 1000);
    }

    if (input.includes("T")) {
        return new Date(input);
    }

    if (input.includes(" ")) {
        return new Date(`${input.replace(" ", "T")}Z`);
    }

    return new Date(input);
};

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
        const date = parseDate(input);
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


export const formatRelativeTime = (input: string | number | null | undefined) => {
    if (!input) return "Never";

    const date = parseDate(input);
    if (isNaN(date.getTime())) return "Never";

    const diffInSecs = Math.floor((date.getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always", style: "short" });

    for (const { unit, seconds } of RELATIVE_TIME_UNITS) {
        if (Math.abs(diffInSecs) >= seconds) {
            return rtf.format(Math.floor(diffInSecs / seconds), unit);
        }
    }

    return "Just now";
};


export const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    const diffTime = new Date(dateString).getTime() - new Date().getTime();

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};


export const getYear = (date?: string | null) => {
    return date?.split("-")[0] ?? "-";
};


export const getMonthName = (month: string) => {
    if (!isNaN(Number(month))) {
        return new Date(0, Number(month) - 1).toLocaleString("en", { month: "long" });
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

    const date = parseDate(value);
    if (isNaN(date.getTime())) return undefined;

    return date.toISOString();
};
