import {movies, moviesList} from "@/lib/server/database/schema";
import {AdvancedMediaStats, TopMetricStats} from "@/lib/types/base.types";
import {moviesAchievements} from "@/lib/server/domain/media/movies/achievements.seed";


export type Movie = typeof movies.$inferSelect;


export type MoviesList = typeof moviesList.$inferSelect;


export type MoviesAchCodeName = typeof moviesAchievements[number]["codeName"];


export type MoviesTopMetricStats = {
    langsStats: TopMetricStats;
    actorsStats: TopMetricStats;
    directorsStats: TopMetricStats;
};


export type UpsertMovieWithDetails = {
    mediaData: typeof movies.$inferInsert,
    actorsData?: { name: string }[],
    genresData?: { name: string }[],
};


export type MoviesAdvancedStats = AdvancedMediaStats & {
    langsStats: TopMetricStats;
    actorsStats: TopMetricStats;
    directorsStats: TopMetricStats;
    totalBudget: number | undefined,
    totalRevenue: number | null | undefined;
}
