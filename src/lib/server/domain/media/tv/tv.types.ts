import {anime, animeList, series, seriesList} from "@/lib/server/database/schema";
import {TopMetricStats} from "@/lib/server/types/base.types";


export type Series = typeof series.$inferSelect;
export type Anime = typeof anime.$inferSelect;

export type SeriesList = typeof seriesList.$inferSelect;
export type AnimeList = typeof animeList.$inferSelect;

export type TvType = Series | Anime;
export type TvList = SeriesList | AnimeList;


export type UpsertTvWithDetails = {
    mediaData: typeof series.$inferInsert | typeof anime.$inferInsert,
    actorsData: { name: string }[],
    genresData: { name: string }[],
    networkData: { name: string }[],
    seasonsData: { season: number, episodes: number }[],
};


export type TvTopMetricStats = {
    actorsStats: TopMetricStats;
    networksStats: TopMetricStats;
    countriesStats: TopMetricStats;
};