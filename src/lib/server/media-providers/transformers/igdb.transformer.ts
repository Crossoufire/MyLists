import {MediaType} from "@/lib/server/utils/enums";
import {games} from "@/lib/server/database/schema";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {ProviderSearchResults} from "@/lib/server/types/base.types";
import {gamesConfig} from "@/lib/server/domain/media/games/games.config";


type Games = typeof games.$inferInsert;


export class IgdbTransformer {
    private readonly maxGenres = gamesConfig.maxGenres;
    private readonly imageBaseUrl = "https://images.igdb.com/igdb/image/upload/t_1080p/";

    transformSearchResults(rawData: Record<string, any>) {
        const results = rawData?.results ?? [];
        const transformedResults = results.map((item: any) => {
            return {
                id: item.id,
                name: item?.name,
                itemType: MediaType.GAMES,
                date: item?.first_release_date,
                image: item?.cover?.image_id ? `${this.imageBaseUrl}${item?.cover?.image_id}.jpg` : "default.jpg",
            } as ProviderSearchResults;
        });

        return transformedResults as ProviderSearchResults[];
    }

    async transformGamesDetailsResults(rawData: Record<string, any>) {
        console.log({ rawData });

        const mediaData: Games = {
            apiId: rawData.id,
            name: rawData?.name,
            igdbUrl: rawData?.url,
            synopsis: rawData?.summary,
            voteAverage: rawData?.total_rating ?? 0,
            voteCount: rawData?.total_rating_count ?? 0,
            gameEngine: rawData?.game_engines?.[0]?.name,
            playerPerspective: rawData?.player_perspectives?.[0]?.name,
            releaseDate: new Date(rawData?.first_release_date).toISOString(),
            gameModes: rawData?.game_modes?.map((mode: any) => mode?.name).join(","),
            imageCover: await saveImageFromUrl({
                defaultName: "default.jpg",
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/games-covers",
                imageUrl: `${this.imageBaseUrl}${rawData?.cover?.image_id}.jpg`,
            }),
        }

        console.log(mediaData.imageCover);

        const part1GenreData = rawData?.genres?.map((genre: any) => ({ name: genre.name }));
        const part2GenreData = rawData?.themes?.map((theme: any) => ({ name: theme.name }));
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
        const companiesData = rawData?.involved_companies?.map((company: any) => {
            if (company.developer === false && company.publisher === false) return;
            return { name: company.company.name, developer: company.developer, publisher: company.publisher }
        });
        const platformsData = rawData?.platforms?.map((platform: any) => ({ name: platform.name }));

        return { mediaData, companiesData, platformsData, genresData }
    }

    addHLTBDataToMainDetails(hltbRawData: Record<any, any>, mediaData: Games) {
        mediaData.hltbMainTime = hltbRawData.main
        mediaData.hltbMainAndExtraTime = hltbRawData.extra
        mediaData.hltbTotalCompleteTime = hltbRawData.completionist

        return mediaData
    }
}
