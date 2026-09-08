export const convertToCsv = (items: Record<string, any>[]) => {
    if (!items?.length) return "";

    const headers = Object.keys(items[0]);

    const rows = items.map((item) =>
        headers.map((header) => {
            const cell = item[header] ?? "";
            const stringified = String(cell).replace(/"/g, '""');

            return /[",\n\r]/.test(stringified) ? `"${stringified}"` : stringified;
        }).join(","),
    );

    return [headers.join(","), ...rows].join("\r\n");
};
