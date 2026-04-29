import {clientEnv} from "@/env/client";


interface AddSeoProps {
    title: string
    image?: string
    keywords?: string
    canonical?: string
    description?: string
}


const toAbsoluteUrl = (value?: string) => {
    if (!value) return undefined;
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${clientEnv.VITE_BASE_URL}/${value.replace(/^\/+/, "")}`;
};


export const addSeo = ({ title, description, keywords, image, canonical }: AddSeoProps) => {
    const absoluteImage = toAbsoluteUrl(image);
    const absoluteCanonical = toAbsoluteUrl(canonical);

    const tags = [
        { title },
        { property: "og:title", content: title },
        { name: "twitter:title", content: title },
        { property: "og:type", content: "website" },
        { name: "robots", content: "index, follow" },
        { property: "og:site_name", content: "MyLists" },
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        description ? { name: "description", content: description } : undefined,
        description ? { property: "og:description", content: description } : undefined,
        description ? { name: "twitter:description", content: description } : undefined,
        absoluteCanonical ? { property: "og:url", content: absoluteCanonical } : undefined,
        { name: "twitter:card", content: absoluteImage ? "summary_large_image" : "summary" },
        ...(absoluteImage ? [{ property: "og:image", content: absoluteImage }, { name: "twitter:image", content: absoluteImage }] : []),
    ].filter(Boolean);

    return tags;
};


export const addSeoLinks = ({ canonical }: Pick<AddSeoProps, "canonical">) => {
    const absoluteCanonical = toAbsoluteUrl(canonical);

    return [
        ...(absoluteCanonical ? [{ rel: "canonical", href: absoluteCanonical }] : []),
    ];
};
