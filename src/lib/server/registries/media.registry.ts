import { MediaType } from "@/lib/server/utils/enums";
import { MoviesRepository } from "@/lib/server/repositories/media/movies.repository";

/**
 * Registry for media repositories
 */
export class MediaRegistry {
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

/**
 * Registry for media services
 */
export class MediaServiceRegistry {
    private static services: Record<MediaType, any> = {} as Record<MediaType, any>;

    static registerService(mediaType: MediaType, service: any) {
        this.services[mediaType] = service;
    }

    static getService(mediaType: MediaType) {
        if (!this.services[mediaType]) {
            throw new Error(`Service for media type ${mediaType} not registered`);
        }
        return this.services[mediaType];
    }
} 