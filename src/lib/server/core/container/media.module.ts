import {MediaType} from "@/lib/server/utils/enums";
import {TvService} from "@/lib/server/domain/media/tv/tv.service";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {ProviderModule} from "@/lib/server/core/container/provider.module";
import {GamesService} from "@/lib/server/domain/media/games/games.service";
import {BooksService} from "@/lib/server/domain/media/books/books.service";
import {MangaService} from "@/lib/server/domain/media/manga/manga.service";
import {animeConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {MoviesService} from "@/lib/server/domain/media/movies/movies.service";
import {seriesConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {BooksRepository} from "@/lib/server/domain/media/books/books.repository";
import {MangaRepository} from "@/lib/server/domain/media/manga/manga.repository";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {TvProviderService} from "@/lib/server/domain/media/tv/tv.provider.service";
import {BooksProviderService} from "@/lib/server/domain/media/books/books-provider.service";
import {MangaProviderService} from "@/lib/server/domain/media/manga/manga-provider.service";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {MediaProviderServiceRegistry, MediaRepositoryRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


export function setupMediaModule(apiModule: ProviderModule) {
    const { clients, transformers } = apiModule;

    // Media Repositories
    const seriesRepository = new TvRepository(seriesConfig);
    const animeRepository = new TvRepository(animeConfig);
    const moviesRepository = new MoviesRepository();
    const gamesRepository = new GamesRepository();
    const booksRepository = new BooksRepository();
    const mangaRepository = new MangaRepository();
    MediaRepositoryRegistry.registerRepository(MediaType.SERIES, seriesRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.ANIME, animeRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.MOVIES, moviesRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.GAMES, gamesRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.BOOKS, booksRepository);
    MediaRepositoryRegistry.registerRepository(MediaType.MANGA, mangaRepository);

    // Media Services
    const seriesService = new TvService(seriesRepository);
    const animeService = new TvService(animeRepository);
    const moviesService = new MoviesService(moviesRepository);
    const gamesService = new GamesService(gamesRepository);
    const bookService = new BooksService(booksRepository);
    const mangaService = new MangaService(mangaRepository);
    MediaServiceRegistry.registerService(MediaType.SERIES, seriesService);
    MediaServiceRegistry.registerService(MediaType.ANIME, animeService);
    MediaServiceRegistry.registerService(MediaType.MOVIES, moviesService);
    MediaServiceRegistry.registerService(MediaType.GAMES, gamesService);
    MediaServiceRegistry.registerService(MediaType.BOOKS, bookService);
    MediaServiceRegistry.registerService(MediaType.MANGA, mangaService);

    // Media Providers Services
    const seriesProviderService = new TvProviderService(clients.tmdb, transformers.tmdb, seriesRepository, clients.jikan);
    const animeProviderService = new TvProviderService(clients.tmdb, transformers.tmdb, animeRepository, clients.jikan);
    const moviesProviderService = new MoviesProviderService(clients.tmdb, transformers.tmdb, moviesRepository);
    const gamesProviderService = new GamesProviderService(clients.igdb, transformers.igdb, gamesRepository, clients.hltb);
    const booksProviderService = new BooksProviderService(clients.gBook, transformers.gBook, booksRepository);
    const mangaProviderService = new MangaProviderService(clients.jikan, transformers.jikan, mangaRepository);
    MediaProviderServiceRegistry.registerService(MediaType.SERIES, seriesProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.ANIME, animeProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.MOVIES, moviesProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.GAMES, gamesProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.BOOKS, booksProviderService);
    MediaProviderServiceRegistry.registerService(MediaType.MANGA, mangaProviderService);

    return {
        mediaRepoRegistry: MediaRepositoryRegistry,
        mediaServiceRegistry: MediaServiceRegistry,
        mediaProviderServiceRegistry: MediaProviderServiceRegistry,
    };
}
