import {MediaType} from "@/lib/server/utils/enums";
import {MoviesService} from "@/lib/server/services/media/movies.service";


export class MediaRepoRegistry {
    private static repositories: Record<MediaType, any> = {} as Record<MediaType, any>;

    static registerRepository(mediaType: MediaType, repository: any) {
        this.repositories[mediaType] = repository;
    }

    static getRepository(mediaType: MediaType) {
        if (!this.repositories[mediaType]) {
            throw new Error(`Repository for media type ${mediaType} not registered`);
        }
        return this.repositories[mediaType];
    }
}


interface MediaServiceMap {
    // [MediaType.SERIES]: MoviesService;
    // [MediaType.ANIME]: MoviesService;
    [MediaType.MOVIES]: MoviesService;
    // [MediaType.GAMES]: GamesService;
    // [MediaType.BOOKS]: MoviesService;
    // [MediaType.MANGA]: MoviesService;
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
