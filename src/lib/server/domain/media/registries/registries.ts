import {MediaType} from "@/lib/server/utils/enums";
import {TvService} from "@/lib/server/domain/media/tv/tv.service";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {GamesService} from "@/lib/server/domain/media/games/games.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {TvProviderService} from "@/lib/server/domain/media/tv/tv.provider.service";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";


export interface MediaRepositoryMap {
    [MediaType.SERIES]: TvRepository;
    [MediaType.ANIME]: TvRepository;
    [MediaType.MOVIES]: MoviesRepository;
    [MediaType.GAMES]: GamesRepository;
    [MediaType.BOOKS]: MoviesRepository;
    [MediaType.MANGA]: MoviesRepository;
}


export interface MediaServiceMap {
    [MediaType.SERIES]: TvService;
    [MediaType.ANIME]: TvService;
    [MediaType.MOVIES]: MoviesService;
    [MediaType.GAMES]: GamesService;
    [MediaType.BOOKS]: MoviesService;
    [MediaType.MANGA]: MoviesService;
}


export type MediaService = TvService | MoviesService | GamesService;


export interface MediaProviderServiceMap {
    [MediaType.SERIES]: TvProviderService;
    [MediaType.ANIME]: TvProviderService;
    [MediaType.MOVIES]: MoviesProviderService;
    [MediaType.GAMES]: GamesProviderService;
    [MediaType.BOOKS]: MoviesProviderService;
    [MediaType.MANGA]: MoviesProviderService;
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
