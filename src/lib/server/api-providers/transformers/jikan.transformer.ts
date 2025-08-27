import {MediaType} from "@/lib/server/utils/enums";
import {manga} from "@/lib/server/database/schema";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {JikanDetails, JikanMangaSearchResponse, ProviderSearchResult, ProviderSearchResults, SearchData} from "@/lib/server/types/provider.types";


type Manga = typeof manga.$inferInsert;


export class JikanTransformer {
    transformSearchResults(searchData: SearchData<JikanMangaSearchResponse>): ProviderSearchResults {
        const results = searchData.rawData.data;
        const hasNextPage = searchData.rawData.pagination.has_next_page;

        const transformedResults = results.map((item): ProviderSearchResult => {
            return {
                id: item.mal_id,
                date: item.published.from,
                itemType: MediaType.MANGA,
                name: item.title_english ?? item.title,
                image: item.images.jpg.image_url ?? "default.jpg",
            };
        });

        return { data: transformedResults, hasNextPage };
    }

    async transformMangaDetailsResults(rawData: JikanDetails) {
        const mediaData: Manga = {
            siteUrl: rawData.url,
            apiId: rawData.mal_id,
            volumes: rawData.volumes,
            chapters: rawData.chapters,
            synopsis: rawData.synopsis,
            prodStatus: rawData.status,
            voteAverage: rawData.score,
            originalName: rawData.title,
            voteCount: rawData.scored_by,
            popularity: rawData.popularity,
            endDate: rawData.published.to,
            releaseDate: rawData.published.from,
            name: rawData.title_english ?? rawData.title,
            publishers: rawData.serializations?.[0]?.name ?? null,
            imageCover: await saveImageFromUrl({
                defaultName: "default.jpg",
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/manga-covers",
                imageUrl: rawData.images.jpg.large_image_url ?? "default.jpg",
            }),
        }

        const genresData = rawData?.genres.map((genre) => ({ name: genre.name }));
        const authorsData = (rawData?.authors ?? [])
            .slice(0, 2)
            .map((author) => {
                const [last, first] = author.name?.split(",", 2) ?? [""];
                return first ? `${first.trim()} ${last.trim()}` : last;
            });
        ;

        return { mediaData, authorsData, genresData }
    }
}
