import {MediaType} from "@/lib/server/utils/enums";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";


interface MediaRepoMap {
    [MediaType.SERIES]: MoviesRepository;
    [MediaType.ANIME]: MoviesRepository;
    [MediaType.MOVIES]: MoviesRepository;
    [MediaType.GAMES]: MoviesRepository;
    [MediaType.BOOKS]: MoviesRepository;
    [MediaType.MANGA]: MoviesRepository;
}


interface MediaServiceMap {
    [MediaType.SERIES]: MoviesService;
    [MediaType.ANIME]: MoviesService;
    [MediaType.MOVIES]: MoviesService;
    [MediaType.GAMES]: MoviesService;
    [MediaType.BOOKS]: MoviesService;
    [MediaType.MANGA]: MoviesService;
}


export class MediaRepoRegistry {
    private static repositories: MediaRepoMap = {} as MediaRepoMap;

    static registerRepository<T extends keyof MediaRepoMap>(mediaType: T, repository: MediaRepoMap[T]) {
        this.repositories[mediaType] = repository;
    }

    static getRepository<T extends keyof MediaRepoMap>(mediaType: T) {
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
