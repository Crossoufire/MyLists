import {EpsPerSeasonType, TopMetricStats} from "@/lib/server/types/base.types";
import {anime, animeList, series, seriesList} from "@/lib/server/database/schema";
import {animeAchievements} from "@/lib/server/domain/media/tv/anime/achievements.seed";
import {seriesAchievements} from "@/lib/server/domain/media/tv/series/achievements.seed";


export type Series = typeof series.$inferSelect & { epsPerSeason?: EpsPerSeasonType };
export type Anime = typeof anime.$inferSelect & { epsPerSeason?: EpsPerSeasonType };

export type SeriesList = typeof seriesList.$inferSelect & { epsPerSeason?: EpsPerSeasonType };
export type AnimeList = typeof animeList.$inferSelect & { epsPerSeason?: EpsPerSeasonType };

export type TvType = Series | Anime;
export type TvList = SeriesList | AnimeList;

export type AnimeAchCodeName = typeof animeAchievements[number]["codeName"];
export type SeriesAchCodeName = typeof seriesAchievements[number]["codeName"];
export type TvAchCodeName = AnimeAchCodeName | SeriesAchCodeName;

export type UpsertTvWithDetails = {
    mediaData: typeof series.$inferInsert | typeof anime.$inferInsert,
    actorsData: { name: string }[],
    networkData: { name: string }[],
    genresData: { name: string }[] | null,
    seasonsData: { season: number, episodes: number }[],
};


export type TvTopMetricStats = {
    actorsStats: TopMetricStats;
    networksStats: TopMetricStats;
    countriesStats: TopMetricStats;
};
