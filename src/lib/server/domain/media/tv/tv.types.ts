import * as z from "zod";
import {REDO_MAX} from "@/lib/utils/constants";
import {createInsertSchema} from "drizzle-zod";
import {MediaType, TvMediaType} from "@/lib/utils/enums";
import {minimalMyListsCSVSchema} from "@/lib/types/imports.types";
import {tvSeasonStatesSchema} from "@/lib/schemas/tv-seasons.schema";
import {anime, animeList, series, seriesList} from "@/lib/server/database/schema";
import {
    importCommentSchema,
    importFavoriteSchema,
    importPositiveProgressSchema,
    importProgressSchema,
    importRatingSchema,
    importStatusSchema,
    importTotalSchema
} from "@/lib/server/domain/imports/import-list-validation";


type Series = typeof series.$inferSelect;
type Anime = typeof anime.$inferSelect;

type SeriesList = typeof seriesList.$inferSelect;
type AnimeList = typeof animeList.$inferSelect;

export type TvType = Series | Anime;
export type TvList = SeriesList | AnimeList;
export type TvImportPayload = z.infer<typeof tvImportPayloadSchema>;
export type UpsertTvWithDetails = {
    mediaData: typeof series.$inferInsert | typeof anime.$inferInsert,
    actorsData?: { name: string }[],
    networkData?: { name: string }[],
    genresData?: { name: string }[] | null,
    seasonsData?: { season: number, episodes: number }[],
};

export type UpdateTvWithDetails = Omit<UpsertTvWithDetails, "mediaData"> & {
    mediaData: Partial<UpsertTvWithDetails["mediaData"]> & Pick<UpsertTvWithDetails["mediaData"], "apiId">;
};


const parseTvRedo = (value: unknown) => {
    if (value === "") return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return value;

    const trimmedValue = value.trim();
    if (!trimmedValue) return undefined;

    if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
        try {
            return JSON.parse(trimmedValue);
        }
        catch {
            return value;
        }
    }

    const parts = trimmedValue.split(",").map((part) => part.trim());
    if (parts.some((part) => part === "")) return value;

    return parts.map((part) => Number(part));
};

const tvListSchemaOverrides = (mediaType: TvMediaType) => ({

    total: importTotalSchema,
    rating: importRatingSchema,
    comment: importCommentSchema,
    favorite: importFavoriteSchema,
    currentEpisode: importProgressSchema,
    status: importStatusSchema(mediaType),
    currentSeason: importPositiveProgressSchema,
});


const seasonalImportFields = {
    // Version 1 files contain a positional rewatch array; version 2 exports explicit seasons.
    redo: z.preprocess(parseTvRedo, z.array(z.coerce.number().int().min(0).max(REDO_MAX)).optional()),
    seasons: z.preprocess((value) => {
        if (value === "" || value === undefined) return undefined;
        if (typeof value !== "string") return value;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }, tvSeasonStatesSchema.optional()),
};


const seriesCSVListSchema = createInsertSchema(seriesList, tvListSchemaOverrides(MediaType.SERIES)).extend(seasonalImportFields);


const animeCSVListSchema = createInsertSchema(animeList, tvListSchemaOverrides(MediaType.ANIME)).extend(seasonalImportFields);


const seriesFinalListInsertSchema = createInsertSchema(seriesList, {
    status: importStatusSchema(MediaType.SERIES),
    customCover: z.string().nullable().optional(),
    redo: z.number().int().min(0),
}).extend({ seasons: tvSeasonStatesSchema });


const animeFinalListInsertSchema = createInsertSchema(animeList, {
    status: importStatusSchema(MediaType.ANIME),
    customCover: z.string().nullable().optional(),
    redo: z.number().int().min(0),
}).extend({ seasons: tvSeasonStatesSchema });


const seriesImportPayloadSchema = seriesCSVListSchema.omit({
    id: true,
    userId: true,
    mediaId: true,
    addedAt: true,
    customCover: true,
    lastUpdated: true,
});


const animeImportPayloadSchema = animeCSVListSchema.omit({
    id: true,
    userId: true,
    mediaId: true,
    addedAt: true,
    customCover: true,
    lastUpdated: true,
});


const withoutLegacyRedo = (value: unknown) => {
    if (typeof value !== "object" || value === null || !("seasons" in value) || !value.seasons) return value;
    return { ...value, redo: undefined };
};


export const tvImportPayloadSchema = z.preprocess(withoutLegacyRedo, z.union([seriesImportPayloadSchema, animeImportPayloadSchema]));


export const tvFinalListInsertSchema = z.union([seriesFinalListInsertSchema, animeFinalListInsertSchema]);


export const seriesMyListsCSVRowSchema = z.preprocess(withoutLegacyRedo, minimalMyListsCSVSchema.extend(seriesImportPayloadSchema.shape));


export const animeMyListsCSVRowSchema = z.preprocess(withoutLegacyRedo, minimalMyListsCSVSchema.extend(animeImportPayloadSchema.shape));
