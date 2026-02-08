import {MediaType} from "@/lib/utils/enums";
import {getImageUrl} from "@/lib/utils/image-url";
import {formatHtmlText} from "@/lib/utils/formating";
import {saveImageFromUrl} from "@/lib/utils/image-saver";
import {GBooksDetails, GBooksSearchResults, ProviderSearchResult, SearchData} from "@/lib/types/provider.types";


const transformSearchResults = (searchData: SearchData<GBooksSearchResults>) => {
    const results = searchData.rawData?.items ?? [];
    const hasNextPage = searchData.rawData.totalItems > (searchData.page * searchData.resultsPerPage);

    const transformedResults = results.map((item): ProviderSearchResult => {
        return {
            id: item.id,
            itemType: MediaType.BOOKS,
            date: item.volumeInfo?.publishedDate ?? 1900,
            name: item.volumeInfo?.title ?? "No Title Found",
            image: item.volumeInfo?.imageLinks?.thumbnail ?? getImageUrl("books-covers"),
        };
    });

    return { data: transformedResults, hasNextPage };
};


const transformBooksDetailsResults = async (rawData: GBooksDetails) => {
    const mediaData = {
        apiId: rawData.id,
        language: rawData.volumeInfo.language,
        publishers: rawData.volumeInfo.publisher,
        pages: rawData.volumeInfo.pageCount ?? 50,
        name: rawData.volumeInfo.title ?? "No Title Found",
        synopsis: formatHtmlText(rawData.volumeInfo.description ?? "No Description Found"),
        releaseDate: rawData.volumeInfo.publishedDate ? new Date(rawData.volumeInfo.publishedDate).toISOString() : null,
        imageCover: await saveImageFromUrl({
            dirSaveName: "books-covers",
            imageUrl: rawData.volumeInfo.imageLinks?.extraLarge ??
                rawData.volumeInfo.imageLinks?.large ?? rawData.volumeInfo.imageLinks?.medium,
        }),
    }

    const authorsData = rawData.volumeInfo?.authors?.map((name) => ({ name }));

    return { mediaData, authorsData };
};


export const gbooksTransformer = {
    transformSearchResults,
    transformDetailsResults: transformBooksDetailsResults,
}
