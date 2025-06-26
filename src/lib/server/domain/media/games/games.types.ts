import {games, gamesList} from "@/lib/server/database/schema";
import {TopMetricStats} from "@/lib/server/types/base.types";


export type Game = typeof games.$inferInsert;
export type GamesList = typeof gamesList.$inferSelect;


export type UpsertGameWithDetails = {
    mediaData: typeof games.$inferInsert,
    genresData: { name: string }[],
    platformsData: { name: string }[],
    companiesData: { name: string, developer: boolean, publisher: boolean }[],
};


export type GamesTopMetricStats = {
    enginesStats: TopMetricStats;
    platformsStats: TopMetricStats;
    developersStats: TopMetricStats;
    publishersStats: TopMetricStats;
    perspectivesStats: TopMetricStats;
};
