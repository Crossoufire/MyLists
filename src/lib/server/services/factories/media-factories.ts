import {MediaType} from "@/lib/server/utils/enums";
import {MoviesRepository} from "@/lib/server/repositories/media/movies.repository";


export class MediaServiceFactory {
    static getService(mediaType: MediaType) {
        switch (mediaType) {
            case MediaType.SERIES:
            // return new SeriesService();
            case MediaType.MOVIES:
            // return new MoviesService();
            case MediaType.BOOKS:
            // return new BookService();
            default:
                throw new Error(`Unsupported media type: ${mediaType}`);
        }
    }
}


export class MediaRepositoryFactory {
    static getRepository(mediaType: MediaType) {
        switch (mediaType) {
            case MediaType.SERIES:
            // return new SeriesService();
            case MediaType.MOVIES:
                return MoviesRepository;
            case MediaType.BOOKS:
            // return new BookService();
            default:
                throw new Error(`Unsupported media type: ${mediaType}`);
        }
    }
}