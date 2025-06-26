import {TopMetricStats} from "@/lib/server/types/base.types";
import {movies, moviesList} from "@/lib/server/database/schema";
import {moviesAchievements} from "@/lib/server/domain/media/movies/achievements.seed";


export type Movie = typeof movies.$inferSelect;
export type MoviesList = typeof moviesList.$inferSelect;


export type UpsertMovieWithDetails = {
    mediaData: typeof movies.$inferInsert,
    actorsData: { name: string }[],
    genresData: { name: string }[],
};


export type MoviesTopMetricStats = {
    langsStats: TopMetricStats;
    actorsStats: TopMetricStats;
    directorsStats: TopMetricStats;
};


export type MoviesAchCodeName = typeof moviesAchievements[number]["codeName"];
