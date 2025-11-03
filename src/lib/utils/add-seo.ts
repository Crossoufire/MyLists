interface AddSeoProps {
    title: string
    image?: string
    keywords?: string
    description?: string
}


export const addSeo = ({ title, description, keywords, image }: AddSeoProps) => {
    const tags = [
        { title },
        { name: "description", content: description },
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(image
            ? [
                { property: "og:image", content: image },
                { name: "twitter:image", content: image },
                { name: "twitter:card", content: "summary_large_image" },
            ]
            : []),
    ];

    return tags;
};
