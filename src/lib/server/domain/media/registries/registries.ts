import {MediaType} from "@/lib/server/utils/enums";
import {IProviderService, ITrendsProviderService} from "@/lib/server/types/provider.types";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {IGamesService, IMoviesService, ITvService} from "@/lib/server/types/services.types";


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
    [MediaType.SERIES]: ITrendsProviderService;
    [MediaType.ANIME]: IProviderService;
    [MediaType.MOVIES]: ITrendsProviderService;
    [MediaType.GAMES]: IProviderService;
    [MediaType.BOOKS]: IProviderService;
    [MediaType.MANGA]: IProviderService;
}


export class MediaRepositoryRegistry {
    private static repositories: Partial<MediaRepositoryMap> = {};

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
    private static providers: Partial<MediaProviderServiceMap> = {};

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
