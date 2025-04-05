export class GbooksTransformer {
    async transformSearchResults(data: Record<string, any>) {
        return data.results.map((item: any) => ({
            apiId: item.id,
            name: item.title,
            imageCover: item.image,
            date: item.releaseDate,
            mediaType: "Books",
        }));
    }

    async transformDetails(data: Record<string, any>) {
        return {
            apiId: data.id,
            name: data.title,
            imageCover: data.image,
            date: data.releaseDate,
            mediaType: "Books",
        };
    }
}
