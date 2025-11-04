import {MediaType} from "@/lib/utils/enums";
import {getImageUrl} from "@/lib/utils/image-url";
import {books} from "@/lib/server/database/schema";
import {saveImageFromUrl} from "@/lib/utils/save-image";
import {cleanHtmlText} from "@/lib/utils/clean-html-text";
import {GBooksDetails, GBooksSearchResults, ProviderSearchResult, ProviderSearchResults, SearchData} from "@/lib/types/provider.types";


type InsertBook = typeof books.$inferInsert;


export class GBooksTransformer {
    transformSearchResults(searchData: SearchData<GBooksSearchResults>): ProviderSearchResults {
        const results = searchData.rawData?.items ?? [];
        const hasNextPage = searchData.rawData.totalItems > (searchData.page * searchData.resultsPerPage);

        const transformedResults = results.map((item): ProviderSearchResult => {
            return {
                id: item.id,
                itemType: MediaType.BOOKS,
                name: item.volumeInfo.title,
                date: item.volumeInfo.publishedDate,
                image: item.volumeInfo?.imageLinks?.thumbnail ?? getImageUrl("books-covers"),
            };
        });

        return { data: transformedResults, hasNextPage };
    }

    async transformBooksDetailsResults(rawData: GBooksDetails) {
        const mediaData: InsertBook = {
            apiId: rawData.id,
            name: rawData.volumeInfo.title,
            language: rawData.volumeInfo.language,
            publishers: rawData.volumeInfo.publisher,
            pages: rawData.volumeInfo.pageCount ?? 50,
            synopsis: cleanHtmlText(rawData.volumeInfo.description),
            releaseDate: rawData.volumeInfo.publishedDate ? new Date(rawData.volumeInfo.publishedDate).toISOString() : null,
            imageCover: await saveImageFromUrl({
                dirSaveName: "books-covers",
                imageUrl: rawData.volumeInfo.imageLinks?.extraLarge ??
                    rawData.volumeInfo.imageLinks?.large ?? rawData.volumeInfo.imageLinks?.medium,
            }),
        }

        const authorsData = rawData?.volumeInfo.authors.map((name) => ({ name }));

        return { mediaData, authorsData };
    }
}
