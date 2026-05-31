const withFallback = <T>(value: T | null | undefined, formatter: (v: T) => string, fallback = "-") => {
    return value === null || value === undefined || value === "" ? fallback : formatter(value);
};


export const zeroPad = (value: number | string | null | undefined) => {
    return String(value ?? 0).padStart(2, "0");
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


export const computeLevel = (totalTime: number) => {
    return (Math.sqrt(400 + 80 * totalTime) - 20) / 40;
}
