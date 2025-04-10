import {MediaType} from "@/lib/server/utils/enums";
import {saveImageFromUrl} from "@/lib/server/utils/save-image";
import {ProviderSearchResults} from "@/lib/server/domain/media-providers/interfaces/types";


export class TmdbTransformer {
    private readonly imageBaseUrl = "https://image.tmdb.org/t/p/w300";
    private readonly defaultDuration = 90;
    private readonly maxActors = 5;
    private readonly maxGenres = 5;

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

            return { ...baseInfo, ...details };
        });

        return transformedResults as ProviderSearchResults[];
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

        return { name, date, itemType };
    }

    private processSearchMovie(item: Record<string, any>) {
        const date = item.release_date;
        const itemType = MediaType.MOVIES;
        const name = item.original_title || item.title;

        return { name, date, itemType };
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
            lastApiUpdate: new Date().toISOString(),
            originalLanguage: rawData?.original_language,
            collectionId: rawData?.belongs_to_collection?.id,
            duration: rawData?.runtime ?? this.defaultDuration,
            releaseDate: new Date(rawData?.release_date).toISOString(),
            directorName: rawData?.credits?.crew?.find((crew: any) => crew.job === "Director")?.name,
            compositorName: rawData?.credits?.crew?.find((crew: any) => crew.job === "Original Music Composer")?.name,
            imageCover: await saveImageFromUrl({
                imageUrl: `${this.imageBaseUrl}${rawData?.poster_path}`,
                saveLocation: "public/static/covers/movies-covers",
                defaultName: "default.jpg",
                resize: { width: 300, height: 450 },
            }),
        }

        const genresData = rawData?.genres?.slice(0, this.maxGenres).map((genre: any) => ({ name: genre.name }));
        const actorsData = rawData?.credits?.cast?.slice(0, this.maxActors).map((cast: any) => ({ name: cast.name }));

        return { mediaData, actorsData, genresData }
    }
}
