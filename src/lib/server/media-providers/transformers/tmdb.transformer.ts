import {MediaType} from "@/lib/server/utils/enums";
import {anime} from "@/lib/server/database/schema";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {ProviderSearchResults} from "@/lib/server/types/base.types";
import {moviesConfig} from "@/lib/server/domain/media/movies/movies.config";


type Anime = typeof anime.$inferInsert;

type Options = {
    defaultDuration: number;
    imageSaveLocation: string;
}


export class TmdbTransformer {
    private readonly maxActors = 5;
    private readonly maxNetworks = 5;
    private readonly animeDefaultDuration = 24;
    private readonly seriesDefaultDuration = 40;
    private readonly moviesDefaultDuration = 90;
    private readonly maxGenres = moviesConfig.apiProvider.maxGenres;
    private readonly imageBaseUrl = "https://image.tmdb.org/t/p/w300";

    transformSearchResults(rawData: Record<string, any>) {
        const results = rawData?.results ?? [];
        const filteredResults = results.filter((item: any) =>
            !item.known_for_department && (item.media_type === "tv" || item.media_type === "movie")
        );

        const transformedResults = filteredResults.map((item: any) => {
            const baseInfo = {
                id: item.id,
                image: item.poster_path ? `${this.imageBaseUrl}${item.poster_path}` : "default.jpg",
            };

            let details = {};
            if (item.media_type === "tv") details = this.processSearchTv(item);
            if (item.media_type === "movie") details = this.processSearchMovie(item);

            return { ...baseInfo, ...details } as ProviderSearchResults;
        });

        return transformedResults as ProviderSearchResults[];
    }

    processCreatedBy(rawData: Record<string, any>) {
        const creators = rawData?.created_by;
        if (creators?.length) {
            return creators.map((creator: any) => creator.name).join(", ");
        }

        const writers = rawData?.credits?.crew?.filter((m: any) => m.department === "Writing" && m.known_for_department === "Writing");
        if (!writers?.length) {
            return;
        }

        const uniqueWriterNames = Array.from(new Set(writers.map((writer: any) => writer.name)));
        const topWriters = uniqueWriterNames
            .sort((nameA, nameB) => {
                const popularityA = writers.find((w: any) => w.name === nameA)?.popularity || 0;
                const popularityB = writers.find((w: any) => w.name === nameB)?.popularity || 0;
                return popularityB - popularityA;
            }).slice(0, 2);

        return topWriters.join(", ");
    }

    private processSearchTv(item: Record<string, any>) {
        const date = item.first_air_date;
        const name = item.original_name || item.name;

        let itemType: MediaType = MediaType.SERIES;

        const isJapanese = item.original_language === "ja" ||
            (Array.isArray(item.origin_country) ? item.origin_country.includes("JP") : item.origin_country === "JP");
        const isAnimationGenre = item.genre_ids?.includes(16) ?? false;

        if (isJapanese && isAnimationGenre) {
            itemType = MediaType.ANIME;
        }

        return { name, date, itemType } as ProviderSearchResults;
    }

    private processSearchMovie(item: Record<string, any>) {
        const date = item.release_date;
        const itemType = MediaType.MOVIES;
        const name = item.original_title || item.title;

        return { name, date, itemType } as ProviderSearchResults;
    }

    async transformMoviesDetailsResults(rawData: Record<string, any>) {
        const mediaData = {
            apiId: rawData.id,
            name: rawData?.title,
            tagline: rawData?.tagline,
            synopsis: rawData?.overview,
            homepage: rawData?.homepage,
            budget: rawData?.budget ?? 0,
            revenue: rawData?.revenue ?? 0,
            voteCount: rawData?.vote_count ?? 0,
            popularity: rawData?.popularity ?? 0,
            originalName: rawData?.original_title,
            voteAverage: rawData?.vote_average ?? 0,
            originalLanguage: rawData?.original_language,
            collectionId: rawData?.belongs_to_collection?.id,
            duration: rawData?.runtime ?? this.moviesDefaultDuration,
            releaseDate: new Date(rawData?.release_date).toISOString(),
            directorName: rawData?.credits?.crew?.find((crew: any) => crew.job === "Director")?.name,
            compositorName: rawData?.credits?.crew?.find((crew: any) => crew.job === "Original Music Composer")?.name,
            imageCover: await saveImageFromUrl({
                defaultName: "default.jpg",
                resize: { width: 300, height: 450 },
                saveLocation: "public/static/covers/movies-covers",
                imageUrl: `${this.imageBaseUrl}${rawData?.poster_path}`,
            }),
        }

        const genresData = rawData?.genres?.slice(0, this.maxGenres).map((genre: any) => ({ name: genre.name }));
        const actorsData = rawData?.credits?.cast?.slice(0, this.maxActors).map((cast: any) => ({ name: cast.name }));

        return { mediaData, actorsData, genresData }
    }

    async transformAnimeDetailsResults(rawData: Record<string, any>) {
        return this._transformTvDetailsResults(rawData, {
            defaultDuration: this.animeDefaultDuration,
            imageSaveLocation: "public/static/covers/anime-covers",
        });
    }

    async transformSeriesDetailsResults(rawData: Record<string, any>) {
        return this._transformTvDetailsResults(rawData, {
            defaultDuration: this.seriesDefaultDuration,
            imageSaveLocation: "public/static/covers/series-covers",
        });
    }

    async transformMoviesTrends(rawData: Record<string, any>) {
        const moviesTrends = [];

        const rawResults = rawData?.results ?? [];
        for (const result of rawResults) {
            const mediaData = {
                apiId: result.id,
                overview: result?.overview,
                displayName: result?.title,
                mediaType: MediaType.MOVIES,
                releaseDate: new Date(result?.release_date),
                posterPath: result?.poster_path ? `${this.imageBaseUrl}${result.poster_path}` : "default.jpg",
            }

            moviesTrends.push(mediaData);
        }

        return moviesTrends
    }

    addAnimeSpecificGenres(jikanData: Record<string, any>[], genresData: { name: string }[]) {
        const { genres = [], demographics = [] } = jikanData?.[0] || {};
        const genreList = genres.map((g: any) => ({ name: g.name })) as { name: string }[];
        const demoList = demographics.map((d: any) => ({ name: d.name })) as { name: string }[];

        const newGenres = demoList.length >= 5
            ? demoList.slice(0, 5) : [...demoList, ...genreList.slice(0, 5 - demoList.length)];

        return newGenres.length ? newGenres : genresData;
    }

    private async _transformTvDetailsResults(rawData: Record<string, any>, options: Options) {
        const { defaultDuration, imageSaveLocation } = options;

        const mediaData = {
            apiId: rawData.id,
            name: rawData?.name,
            synopsis: rawData?.overview,
            homepage: rawData?.homepage,
            prodStatus: rawData?.status,
            voteCount: rawData?.vote_count ?? 0,
            popularity: rawData?.popularity ?? 0,
            originalName: rawData?.original_name,
            voteAverage: rawData?.vote_average ?? 0,
            createdBy: this.processCreatedBy(rawData),
            originCountry: rawData?.origin_country?.[0],
            totalSeasons: rawData?.number_of_seasons ?? 1,
            totalEpisodes: rawData?.number_of_episodes ?? 1,
            nextEpisodeToAir: rawData?.next_episode_to_air?.air_date,
            seasonToAir: rawData?.next_episode_to_air?.season_number,
            episodeToAir: rawData?.next_episode_to_air?.episode_number,
            duration: rawData?.episode_run_time?.[0] ?? defaultDuration,
            lastAirDate: rawData?.last_air_date ? new Date(rawData.last_air_date).toISOString() : null,
            releaseDate: rawData?.first_air_date ? new Date(rawData.first_air_date).toISOString() : null,
            imageCover: await saveImageFromUrl({
                defaultName: "default.jpg",
                saveLocation: imageSaveLocation,
                resize: { width: 300, height: 450 },
                imageUrl: `${this.imageBaseUrl}${rawData?.poster_path}`,
            }),
        };

        const seasonsData = rawData?.seasons
            ?.filter((season: any) => season.season_number && season.season_number > 0)
            .map((season: any) => ({
                season: season.season_number,
                episodes: season.episode_count,
            })) || [{ season: 1, episodes: 1 }];

        const networkData = rawData?.networks?.slice(0, this.maxNetworks).map((network: any) => ({ name: network.name }));
        const actorsData = rawData?.credits?.cast?.slice(0, this.maxActors).map((cast: any) => ({ name: cast.name }));
        const genresData = rawData?.genres
            ?.slice(0, this.maxGenres).map((genre: any) => ({ name: genre.name })) as { name: string }[];

        return {
            mediaData,
            seasonsData,
            networkData,
            actorsData,
            genresData,
        };
    }
}
