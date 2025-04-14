import {MediaType} from "@/lib/server/utils/enums";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";


interface MediaRepoMap {
    [MediaType.MOVIES]: MoviesRepository;
}


interface MediaServiceMap {
    [MediaType.MOVIES]: MoviesService;
}


export class MediaRepoRegistry {
    private static repositories: Partial<MediaRepoMap> = {};

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
    private static services: Partial<MediaServiceMap> = {};

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
