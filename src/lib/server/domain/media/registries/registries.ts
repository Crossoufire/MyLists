import {MediaType} from "@/lib/server/utils/enums";
import {GamesService} from "@/lib/server/domain/media/games/games.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";


export interface MediaRepositoryMap {
    [MediaType.SERIES]: MoviesRepository;
    [MediaType.ANIME]: MoviesRepository;
    [MediaType.MOVIES]: MoviesRepository;
    [MediaType.GAMES]: GamesRepository;
    [MediaType.BOOKS]: MoviesRepository;
    [MediaType.MANGA]: MoviesRepository;
}


export interface MediaServiceMap {
    [MediaType.SERIES]: MoviesService;
    [MediaType.ANIME]: MoviesService;
    [MediaType.MOVIES]: MoviesService;
    [MediaType.GAMES]: GamesService;
    [MediaType.BOOKS]: MoviesService;
    [MediaType.MANGA]: MoviesService;
}


export interface MediaProviderServiceMap {
    [MediaType.SERIES]: MoviesProviderService;
    [MediaType.ANIME]: MoviesProviderService;
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
    private static services: MediaServiceMap = {} as MediaServiceMap;

    static registerService<T extends keyof MediaServiceMap>(mediaType: T, service: MediaServiceMap[T]) {
        this.services[mediaType] = service;
    }

    static getService<T extends keyof MediaServiceMap>(mediaType: T) {
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
