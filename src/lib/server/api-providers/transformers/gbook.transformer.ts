import {MediaType} from "@/lib/server/utils/enums";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {Book} from "@/lib/server/domain/media/books/books.types";
import {GBooksDetails, IgdbSearchResponse, ProviderSearchResult, ProviderSearchResults, SearchData} from "@/lib/server/types/provider.types";


export class GBooksTransformer {
    private readonly imageBaseUrl = "https://images.igdb.com/igdb/image/upload/t_1080p/";

    transformSearchResults(searchData: SearchData<IgdbSearchResponse>): ProviderSearchResults {
        const results = searchData.rawData?.[1]?.result ?? [];
        const hasNextPage = (searchData.rawData?.[0]?.count ?? 0) > (searchData.page * searchData.resultsPerPage);

        const transformedResults = results.map((item): ProviderSearchResult => {
            return {
                id: item.id,
                name: item?.name,
                itemType: MediaType.BOOKS,
                date: item?.first_release_date,
                image: item?.cover?.image_id ? `${this.imageBaseUrl}${item?.cover?.image_id}.jpg` : "default.jpg",
            };
        });

        return { data: transformedResults, hasNextPage };
    }

    async transformBooksDetailsResults(rawData: GBooksDetails) {
        const mediaData: Book = {
            apiId: rawData.id,
            name: rawData?.name,
            pages: rawData?.pages,
            language: rawData?.language,
            publishers: rawData?.publishers,
            synopsis: rawData?.summary || null,
            releaseDate: rawData?.first_release_date ? new Date(rawData?.first_release_date * 1000).toISOString() : null,
            imageCover: await saveImageFromUrl({
                defaultName: "default.jpg",
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/books-covers",
                imageUrl: `${this.imageBaseUrl}${rawData?.cover?.image_id}.jpg`,
            }),
            lockStatus: null,
            lastApiUpdate: null,
        }

        const authorsData = rawData?.involved_companies?.filter(company => company.developer || company.publisher)
            .map(company => ({
                name: company.company.name,
                developer: company.developer,
                publisher: company.publisher,
            }));

        return { mediaData, authorsData, genresData: [] }
    }
}
