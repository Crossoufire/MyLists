import {MediaType} from "@/lib/utils/enums";
import {games} from "@/lib/server/database/schema";
import {getImageUrl} from "@/lib/utils/image-url";
import {saveImageFromUrl} from "@/lib/utils/save-image";
import {gamesConfig} from "@/lib/server/domain/media/games/games.config";
import {HltbGameEntry, IgdbGameDetails, IgdbSearchResponse, ProviderSearchResult, ProviderSearchResults, SearchData} from "@/lib/types/provider.types";


type Games = typeof games.$inferInsert;


export class IgdbTransformer {
    private readonly maxGenres = gamesConfig.apiProvider.maxGenres;
    private readonly imageBaseUrl = "https://images.igdb.com/igdb/image/upload/t_1080p/";

    transformSearchResults(searchData: SearchData<IgdbSearchResponse>): ProviderSearchResults {
        const results = searchData.rawData?.[1]?.result ?? [];
        const hasNextPage = (searchData.rawData?.[0]?.count ?? 0) > (searchData.page * searchData.resultsPerPage);

        const transformedResults = results.map((item): ProviderSearchResult => {
            return {
                id: item.id,
                name: item?.name,
                itemType: MediaType.GAMES,
                date: item?.first_release_date,
                image: item?.cover?.image_id ? `${this.imageBaseUrl}${item?.cover?.image_id}.jpg` : getImageUrl("games-covers"),
            };
        });

        return { data: transformedResults, hasNextPage };
    }

    async transformGamesDetailsResults(rawData: IgdbGameDetails) {
        const mediaData: Games = {
            apiId: rawData.id,
            name: rawData?.name,
            igdbUrl: rawData?.url,
            synopsis: rawData?.summary,
            voteAverage: rawData?.total_rating ?? 0,
            voteCount: rawData?.total_rating_count ?? 0,
            gameEngine: rawData?.game_engines?.[0]?.name,
            playerPerspective: rawData?.player_perspectives?.[0]?.name,
            gameModes: rawData?.game_modes?.map((mode) => mode?.name).join(","),
            releaseDate: rawData.first_release_date ? new Date(rawData.first_release_date * 1000).toISOString() : null,
            hltbMainTime: null,
            hltbMainAndExtraTime: null,
            hltbTotalCompleteTime: null,
            imageCover: await saveImageFromUrl({
                dirSaveName: "games-covers",
                imageUrl: `${this.imageBaseUrl}${rawData?.cover?.image_id}.jpg`,
            }),
        }

        const part1GenreData = rawData?.genres?.map((genre) => ({ name: genre.name })) || [];
        const part2GenreData = rawData?.themes?.map((theme) => ({ name: theme.name })) || [];
        let genresData = [...part1GenreData, ...part2GenreData];
        const renameGenresMap: Record<string, string> = {
            "4X (explore, expand, exploit, and exterminate)": "4X",
            "Hack and slash/Beat 'em up": "Hack and Slash",
            "Card & Board Game": "Card Game",
            "Quiz/Trivia": "Quiz",
        }
        for (const genre of genresData) {
            if (renameGenresMap[genre.name]) {
                genre.name = renameGenresMap[genre.name];
            }
        }

        genresData = genresData.slice(0, this.maxGenres);
        const companiesData = rawData?.involved_companies?.filter(company => company.developer || company.publisher)
            .map(company => ({
                name: company.company.name,
                developer: company.developer,
                publisher: company.publisher,
            }));
        const platformsData = rawData?.platforms?.map((platform) => ({ name: platform.name }));

        return { mediaData, companiesData, platformsData, genresData };
    }

    addHLTBDataToMainDetails(hltbData: HltbGameEntry, mediaData: Games) {
        const mainTime = Number(hltbData.mainStory);
        mediaData.hltbMainTime = isNaN(mainTime) ? null : mainTime;

        const mainExtraTime = Number(hltbData.mainExtra);
        mediaData.hltbMainAndExtraTime = isNaN(mainExtraTime) ? null : mainExtraTime;

        const completionistTime = Number(hltbData.completionist);
        mediaData.hltbTotalCompleteTime = isNaN(completionistTime) ? null : completionistTime;

        return mediaData;
    }
}
