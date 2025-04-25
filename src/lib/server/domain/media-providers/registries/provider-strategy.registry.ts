import {MediaType} from "@/lib/server/utils/enums";
import {TmdbMoviesStrategy} from "@/lib/server/domain/media-providers/strategies/tmdb-movies.strategy";


interface ProviderStrategyMap {
    [MediaType.SERIES]: TmdbMoviesStrategy;
    [MediaType.ANIME]: TmdbMoviesStrategy;
    [MediaType.MOVIES]: TmdbMoviesStrategy;
    [MediaType.GAMES]: TmdbMoviesStrategy;
    [MediaType.BOOKS]: TmdbMoviesStrategy;
    [MediaType.MANGA]: TmdbMoviesStrategy;
}


export class ProviderStrategyRegistry {
    private static strategies: Partial<ProviderStrategyMap> = {};

    static registerStrategy<T extends keyof ProviderStrategyMap>(name: T, strategy: ProviderStrategyMap[T]) {
        this.strategies[name] = strategy;
    }

    static getStrategy<T extends keyof ProviderStrategyMap>(mediaType: T) {
        if (!this.strategies[mediaType]) {
            throw new Error(`Provider Strategy ${mediaType} not registered`);
        }
        return this.strategies[mediaType];
    }
}
