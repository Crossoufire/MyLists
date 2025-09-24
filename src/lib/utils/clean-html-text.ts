export const cleanHtmlText = (rawHtml: string) => {
    try {
        const cleanText = rawHtml.replace(/<.*?>/g, "");
        return cleanText || "";
    }
    catch {
        return "";
    }
};
