import {RatingSystemType} from "@/lib/utils/enums";
import {getFeelingIcon} from "@/lib/utils/functions";


const withFallback = (value: any, formatter: (v: any) => string, fallback = "-") => {
    return value === null || value === undefined || value === "" ? fallback : formatter(value);
};


const parseDate = (input: string | number) => {
    if (typeof input === "number") {
        return new Date(input * 1000);
    }

    return new Date(input.includes("T") ? input : `${input.replace(" ", "T")}Z`);
};


export const zeroPad = (value: number | string | null | undefined) => {
    return String(value ?? 0).padStart(2, "0");
};

export const isLatin1 = (input: string) => {
    return [...input].every((char) => char.charCodeAt(0) <= 255);
}

export const capitalize = (input: string | null | undefined) => {
    const trimmed = input?.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};


export const formatLocaleName = (code: string | undefined | null, type: "language" | "region") => {
    return withFallback(code?.trim(), (code) => {
        if (type === "language" && code.toLowerCase() === "cn") {
            return "Chinese";
        }

        try {
            return new Intl.DisplayNames(["en"], { type }).of(code) || code;
        }
        catch {
            return code;
        }
    });
};

export const formatHtmlText = (input: string) => {
    if (!input) return "";
    return input.replace(/<[^>]*>?/gm, "") || "";
};

export const formatCurrency = (value: number | null, options: Intl.NumberFormatOptions = {}) => {
    return withFallback(value, (val) =>
        new Intl.NumberFormat("en", {
            currency: "USD",
            style: "currency",
            notation: "compact",
            maximumFractionDigits: 1,
            ...options,
        }).format(val),
    );
};

export const formatDuration = (hours: number) => {
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

export const formatAvgRating = (ratingSystem: RatingSystemType, value: number | null) => {
    if (ratingSystem === RatingSystemType.FEELING) {
        return getFeelingIcon(value, { size: 30 });
    }
    return withFallback(value, (val) => val.toFixed(2));
};

export const formatRelativeTime = (input: string | null | undefined) => {
    if (!input) return "Never";

    const date = parseDate(input);
    if (isNaN(date.getTime())) return "Never";

    const diffInMs = date.getTime() - Date.now();
    const diffInSecs = Math.floor(diffInMs / 1000);

    const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
        { unit: "year", seconds: 31536000 },
        { unit: "month", seconds: 2592000 },
        { unit: "day", seconds: 86400 },
        { unit: "hour", seconds: 3600 },
        { unit: "minute", seconds: 60 },
    ];

    for (const { unit, seconds } of units) {
        if (Math.abs(diffInSecs) >= seconds) {
            const value = Math.floor(diffInSecs / seconds);
            return new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(value, unit);
        }
    }

    return "Just now";
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

        const dtfOptions: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: options.onlyYear ? undefined : "short",
            day: options.onlyYear ? undefined : "numeric",
            hour: options.noTime || options.onlyYear ? undefined : "numeric",
            minute: options.noTime || options.onlyYear ? undefined : "numeric",
            second: options.seconds ? "numeric" : undefined,
            hour12: false,
        };

        return new Intl.DateTimeFormat("en-US", dtfOptions).format(date);
    });
};
