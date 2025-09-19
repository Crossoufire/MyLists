import {games, gamesList} from "@/lib/server/database/schema";
import {AdvancedMediaStats, TopMetricStats} from "@/lib/types/base.types";
import {gamesAchievements} from "@/lib/server/domain/media/games/achievements.seed";


export type Game = typeof games.$inferSelect;

export type GamesList = typeof gamesList.$inferSelect;

export type GamesAchCodeName = typeof gamesAchievements[number]["codeName"];

export type UpsertGameWithDetails = {
    mediaData: typeof games.$inferInsert,
    genresData?: { name: string }[],
    platformsData?: { name: string }[],
    companiesData?: { name: string, developer: boolean, publisher: boolean }[],
};

export type GamesAdvancedStats = AdvancedMediaStats & {
    enginesStats: TopMetricStats;
    platformsStats: TopMetricStats;
    developersStats: TopMetricStats;
    publishersStats: TopMetricStats;
    perspectivesStats: TopMetricStats;
    gameModes: { topValues: TopMetricStats["topValues"] };
}
