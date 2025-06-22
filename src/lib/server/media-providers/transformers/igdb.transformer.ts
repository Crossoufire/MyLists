import {MediaType} from "@/lib/server/utils/enums";
import {games} from "@/lib/server/database/schema";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {ProviderSearchResults} from "@/lib/server/types/base.types";
import {gamesConfig} from "@/lib/server/domain/media/games/games.config";
import {GameEntry} from "@/lib/server/media-providers/clients/hltb.client";


type Games = typeof games.$inferInsert;


export class IgdbTransformer {
    private readonly maxGenres = gamesConfig.apiProvider.maxGenres;
    private readonly imageBaseUrl = "https://images.igdb.com/igdb/image/upload/t_1080p/";

    transformSearchResults(rawData: Record<string, any>[]) {
        const results = rawData ?? [];
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
        const mediaData: Games = {
            apiId: rawData.id,
            name: rawData?.name,
            igdbUrl: rawData?.url,
            synopsis: rawData?.summary,
            voteAverage: rawData?.total_rating ?? 0,
            voteCount: rawData?.total_rating_count ?? 0,
            gameEngine: rawData?.game_engines?.[0]?.name,
            playerPerspective: rawData?.player_perspectives?.[0]?.name,
            gameModes: rawData?.game_modes?.map((mode: any) => mode?.name).join(","),
            releaseDate: rawData?.first_release_date ? new Date(rawData?.first_release_date * 1000).toISOString() : null,
            hltbMainTime: null,
            hltbMainAndExtraTime: null,
            hltbTotalCompleteTime: null,
            imageCover: await saveImageFromUrl({
                defaultName: "default.jpg",
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/games-covers",
                imageUrl: `${this.imageBaseUrl}${rawData?.cover?.image_id}.jpg`,
            }),
        }

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
            if (company.developer === false && company.publisher === false) return null;
            return {
                name: company.company.name,
                developer: company.developer,
                publisher: company.publisher,
            };
        }).filter(Boolean);
        const platformsData = rawData?.platforms?.map((platform: any) => ({ name: platform.name }));

        return { mediaData, companiesData, platformsData, genresData }
    }

    addHLTBDataToMainDetails(hltbData: GameEntry, mediaData: Games) {
        mediaData.hltbMainTime = Number(hltbData.mainStory)
        mediaData.hltbMainAndExtraTime = Number(hltbData.mainExtra)
        mediaData.hltbTotalCompleteTime = Number(hltbData.completionist)

        return mediaData
    }
}
