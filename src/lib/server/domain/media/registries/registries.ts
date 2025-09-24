import {MediaType} from "@/lib/utils/enums";
import {TvService} from "@/lib/server/domain/media/tv/tv.service";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {BooksService} from "@/lib/server/domain/media/books/books.service";
import {GamesService} from "@/lib/server/domain/media/games/games.service";
import {MangaService} from "@/lib/server/domain/media/manga/manga.service";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {MangaRepository} from "@/lib/server/domain/media/manga/manga.repository";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {BooksRepository} from "@/lib/server/domain/media/books/books.repository";
import {TvProviderService} from "@/lib/server/domain/media/tv/tv.provider.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {BooksProviderService} from "@/lib/server/domain/media/books/books-provider.service";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {MangaProviderService} from "@/lib/server/domain/media/manga/manga-provider.service";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";


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
