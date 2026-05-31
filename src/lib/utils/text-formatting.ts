const withFallback = <T>(value: T | null | undefined, formatter: (v: T) => string, fallback = "-") => {
    return value === null || value === undefined || value === "" ? fallback : formatter(value);
};


export const isLatin1 = (input: string) => {
    return [...input].every((char) => char.charCodeAt(0) <= 255);
};


export const capitalize = (input: string | null | undefined) => {
    const trimmed = input?.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
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
