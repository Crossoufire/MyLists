import {MediaType} from "@/lib/server/utils/enums";
import {books} from "@/lib/server/database/schema";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {cleanHtmlText} from "@/lib/server/utils/clean-html-text";
import {GBooksDetails, GBooksSearchResults, ProviderSearchResult, ProviderSearchResults, SearchData} from "@/lib/server/types/provider.types";


type Book = typeof books.$inferInsert;


export class GBooksTransformer {
    transformSearchResults(searchData: SearchData<GBooksSearchResults>): ProviderSearchResults {
        const results = searchData.rawData.items;
        const hasNextPage = searchData.rawData.totalItems > (searchData.page * searchData.resultsPerPage);

        const transformedResults = results.map((item): ProviderSearchResult => {
            return {
                id: item.id,
                itemType: MediaType.BOOKS,
                name: item.volumeInfo.title,
                date: item.volumeInfo.publishedDate,
                image: item.volumeInfo?.imageLinks?.thumbnail ?? "default.jpg",
            };
        });

        return { data: transformedResults, hasNextPage };
    }

    async transformBooksDetailsResults(rawData: GBooksDetails) {
        const mediaData: Book = {
            apiId: rawData.id,
            name: rawData.volumeInfo.title,
            language: rawData.volumeInfo.language,
            publishers: rawData.volumeInfo.publisher,
            pages: rawData.volumeInfo.pageCount ?? 50,
            synopsis: cleanHtmlText(rawData.volumeInfo.description),
            releaseDate: rawData.volumeInfo.publishedDate ? new Date(rawData.volumeInfo.publishedDate).toISOString() : null,
            imageCover: await saveImageFromUrl({
                defaultName: "default.jpg",
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/books-covers",
                imageUrl: rawData.volumeInfo.imageLinks?.extraLarge ??
                    rawData.volumeInfo.imageLinks?.large ?? rawData.volumeInfo.imageLinks?.medium ?? "default.jpg",
            }),
        }

        const authorsData = rawData?.volumeInfo.authors.map((name) => ({ name }));

        return { mediaData, authorsData, genresData: [] }
    }
}
