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

const withFallback = <T>(value: T | null | undefined, formatter: (v: T) => string, fallback = "-") => {
    return value === null || value === undefined || value === "" ? fallback : formatter(value);
};


export const CURRENT_DATE = new Date();

export const zeroPad = (value: number | string | null | undefined) => {
    return String(value ?? 0).padStart(2, "0");
};

export const isLatin1 = (input: string) => {
    return [...input].every((char) => char.charCodeAt(0) <= 255);
};

export const capitalize = (input: string | null | undefined) => {
    const trimmed = input?.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};


export const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;
    const diffTime = new Date(dateString).getTime() - CURRENT_DATE.getTime();

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getYear = (date?: string | null) => {
    return date?.split("-")[0] ?? "-";
};


interface FormatDateTimeOptions {
    noTime?: boolean;
    seconds?: boolean;
    onlyYear?: boolean;
}


export const formatDateTime = (value: string | number | null | undefined, options: FormatDateTimeOptions = {}) => {
    return withFallback(value, (input) => {
        const date = parseDate(input);
        if (isNaN(date.getTime())) return "-";

        const { noTime, seconds, onlyYear } = options;
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

export const formatLocaleName = (code: string | undefined | null, type: "language" | "region") => {
    return withFallback(code?.trim(), (c) => {
        if (type === "language" && c.toLowerCase() === "cn") return "Chinese";
        try {
            return new Intl.DisplayNames(["en"], { type }).of(c) || c;
        }
        catch {
            return c;
        }
    });
};

export const formatHtmlText = (input: string) => {
    return input?.replace(/<[^>]*>?/gm, "") ?? "";
};

export const formatCurrency = (value: number | null, options: Intl.NumberFormatOptions = {}) => {
    if (value === null || value === 0) return "$ -";

    return withFallback(value, (val) =>
        new Intl.NumberFormat("en", {
            currency: "USD",
            style: "currency",
            notation: "compact",
            maximumFractionDigits: 1,
            ...options,
        }).format(val)
    );
};

export const formatHours = (hours: number) => {
    if (hours < 24) return `${hours.toFixed(1)}h`;

    const days = Math.floor(hours / 24);
    const h = Math.floor(hours % 24);

    if (days < 30) return `${days}d ${h}h`;
    if (days < 365) return `${Math.floor(days / 30)}m ${days % 30}d`;

    return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
};

export const formatPercent = (value: number | null | undefined) => {
    return withFallback(value, (val) => `${val.toFixed(1)}%`);
};

export const formatNumber = (value: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
    return withFallback(value, (val) => val.toLocaleString("fr", options));
};

export const formatRelativeTime = (input: string | null | undefined) => {
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

export const formatMinutes = (minutes: number | string | null | undefined, options: { onlyHours?: boolean; compact?: boolean } = {}) => {
    if (!minutes) return "-";

    const mins = Number(minutes);
    if (isNaN(mins) || mins <= 0) return "-";

    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);

    if (options.compact) {
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    if (options.onlyHours) {
        return `${zeroPad(h)} h`;
    }

    return `${zeroPad(h)} h ${zeroPad(m)}`;
};

export const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);

    return `${mins}m ${secs}s`;
};

export const getMonthName = (month: string) => {
    if (!isNaN(Number(month))) {
        return new Date(0, Number(month) - 1).toLocaleString("en", { month: "long" });
    }

    return month;
};
