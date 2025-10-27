import {MediaType} from "@/lib/utils/enums";
import {TvProviderService, TvRepository, TvService} from "@/lib/server/domain/media/tv";
import {GamesProviderService, GamesRepository, GamesService} from "@/lib/server/domain/media/games";
import {MangaProviderService, MangaRepository, MangaService} from "@/lib/server/domain/media/manga";
import {BooksProviderService, BooksRepository, BooksService} from "@/lib/server/domain/media/books";
import {MoviesProviderService, MoviesRepository, MoviesService} from "@/lib/server/domain/media/movies";


interface MediaRepositoryMap {
    [MediaType.SERIES]: TvRepository;
    [MediaType.ANIME]: TvRepository;
    [MediaType.MOVIES]: MoviesRepository;
    [MediaType.GAMES]: GamesRepository;
    [MediaType.BOOKS]: BooksRepository;
    [MediaType.MANGA]: MangaRepository;
}


interface MediaServiceMap {
    [MediaType.SERIES]: TvService;
    [MediaType.ANIME]: TvService;
    [MediaType.MOVIES]: MoviesService;
    [MediaType.GAMES]: GamesService;
    [MediaType.BOOKS]: BooksService;
    [MediaType.MANGA]: MangaService;
}


interface MediaProviderServiceMap {
    [MediaType.SERIES]: TvProviderService;
    [MediaType.ANIME]: TvProviderService;
    [MediaType.MOVIES]: MoviesProviderService;
    [MediaType.GAMES]: GamesProviderService;
    [MediaType.BOOKS]: BooksProviderService;
    [MediaType.MANGA]: MangaProviderService;
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
