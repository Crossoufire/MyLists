import {MediaType} from "@/lib/server/utils/enums";
import {TvService} from "@/lib/server/domain/media/tv/tv.service";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {GamesService} from "@/lib/server/domain/media/games/games.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {AnimeProviderService} from "@/lib/server/domain/media/tv/anime/anime-provider.service";
import {SeriesProviderService} from "@/lib/server/domain/media/tv/series/series-provider.service";
import {MediaService} from "@/lib/server/types/services.types";


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
    private static services: MediaServiceMap = {} as MediaServiceMap;

    static registerService<T extends keyof MediaServiceMap>(mediaType: T, service: MediaServiceMap[T]) {
        this.services[mediaType] = service;
    }

    static getService<T extends keyof MediaServiceMap>(mediaType: T) {
        if (!this.services[mediaType]) {
            throw new Error(`Service for media type ${mediaType} not registered`);
        }
        return this.services[mediaType] as MediaService;
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
