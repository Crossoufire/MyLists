import {MediaType} from "@/lib/server/utils/enums";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {IGamesService, IMoviesService, ITvService} from "@/lib/server/types/services.types";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {AnimeProviderService} from "@/lib/server/domain/media/tv/anime/anime-provider.service";
import {SeriesProviderService} from "@/lib/server/domain/media/tv/series/series-provider.service";


export interface MediaRepositoryMap {
    [MediaType.SERIES]: TvRepository;
    [MediaType.ANIME]: TvRepository;
    [MediaType.MOVIES]: MoviesRepository;
    [MediaType.GAMES]: GamesRepository;
    [MediaType.BOOKS]: MoviesRepository;
    [MediaType.MANGA]: MoviesRepository;
}


export interface MediaServiceMap {
    [MediaType.SERIES]: ITvService;
    [MediaType.ANIME]: ITvService;
    [MediaType.MOVIES]: IMoviesService;
    [MediaType.GAMES]: IGamesService;
    [MediaType.BOOKS]: IMoviesService;
    [MediaType.MANGA]: IMoviesService;
}


export interface MediaProviderServiceMap {
    [MediaType.SERIES]: SeriesProviderService;
    [MediaType.ANIME]: AnimeProviderService;
    [MediaType.MOVIES]: MoviesProviderService;
    [MediaType.GAMES]: GamesProviderService;
    [MediaType.BOOKS]: MoviesProviderService;
    [MediaType.MANGA]: MoviesProviderService;
}


export class MediaRepositoryRegistry {
    private static repositories: MediaRepositoryMap = {} as MediaRepositoryMap;

    static registerRepository<T extends keyof MediaRepositoryMap>(mediaType: T, repository: MediaRepositoryMap[T]) {
        this.repositories[mediaType] = repository;
    }

    static getRepository<T extends keyof MediaRepositoryMap>(mediaType: T) {
        if (!this.repositories[mediaType]) {
            throw new Error(`Repository for media type ${mediaType} not registered`);
        }
        return this.repositories[mediaType];
    }
}


export class MediaServiceRegistry {
    private static services: Partial<MediaServiceMap> = {};

    static registerService<T extends keyof MediaServiceMap>(mediaType: T, service: MediaServiceMap[T]) {
        this.services[mediaType] = service;
    }

    static getService<T extends keyof MediaServiceMap>(mediaType: T): MediaServiceMap[T] {
        if (!this.services[mediaType]) {
            throw new Error(`Service for media type ${mediaType} not registered`);
        }
        return this.services[mediaType];
    }
}


export class MediaProviderServiceRegistry {
    private static providers: MediaProviderServiceMap = {} as MediaProviderServiceMap;

    static registerService<T extends keyof MediaProviderServiceMap>(mediaType: T, provider: MediaProviderServiceMap[T]) {
        this.providers[mediaType] = provider;
    }

    static getService<T extends keyof MediaProviderServiceMap>(mediaType: T) {
        if (!this.providers[mediaType]) {
            throw new Error(`ProviderService for media type ${mediaType} not registered`);
        }
        return this.providers[mediaType];
    }
}
