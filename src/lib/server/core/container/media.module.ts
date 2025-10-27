import {MediaType} from "@/lib/utils/enums";
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
import {TvProviderService} from "@/lib/server/domain/media/tv/tv.provider.service";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {BooksProviderService} from "@/lib/server/domain/media/books/books-provider.service";
import {MangaProviderService} from "@/lib/server/domain/media/manga/manga-provider.service";
import {GamesProviderService} from "@/lib/server/domain/media/games/games-provider.service";
import {MoviesProviderService} from "@/lib/server/domain/media/movies/movies-provider.service";
import {MediaProviderServiceRegistry, MediaRepositoryRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


export function setupMediaModule(apiModule: ProviderModule) {
    const { clients, transformers } = apiModule;

    const repositories = {
        series: new TvRepository(seriesConfig),
        anime: new TvRepository(animeConfig),
        movies: new MoviesRepository(),
        games: new GamesRepository(),
        books: new BooksRepository(),
        manga: new MangaRepository()
    };
    Object.entries(repositories).forEach(([key, repo]) => {
        MediaRepositoryRegistry.registerRepository(key as MediaType, repo);
    });

    const services = {
        series: new TvService(repositories.series),
        anime: new TvService(repositories.anime),
        movies: new MoviesService(repositories.movies),
        games: new GamesService(repositories.games),
        books: new BooksService(repositories.books),
        manga: new MangaService(repositories.manga)
    };
    Object.entries(services).forEach(([key, service]) => {
        MediaServiceRegistry.registerService(key as MediaType, service);
    })

    // Create and register provider services
    const providerServices = {
        series: new TvProviderService(clients.tmdb, transformers.tmdb, repositories.series, clients.jikan),
        anime: new TvProviderService(clients.tmdb, transformers.tmdb, repositories.anime, clients.jikan),
        movies: new MoviesProviderService(clients.tmdb, transformers.tmdb, repositories.movies),
        games: new GamesProviderService(clients.igdb, transformers.igdb, repositories.games, clients.hltb),
        books: new BooksProviderService(clients.gBook, clients.llmClient, transformers.gBook, repositories.books),
        manga: new MangaProviderService(clients.jikan, transformers.jikan, repositories.manga)
    };
    Object.entries(providerServices).forEach(([key, service]) => {
        MediaProviderServiceRegistry.registerService(key as MediaType, service);
    })

    return {
        mediaRepoRegistry: MediaRepositoryRegistry,
        mediaServiceRegistry: MediaServiceRegistry,
        mediaProviderServiceRegistry: MediaProviderServiceRegistry,
    };
}
