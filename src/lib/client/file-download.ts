export const saveAsFile = (data: BlobPart, filename: string, mimeType: string) => {
    if (typeof window === "undefined") return;

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
