import * as z from "zod";
import {JobType, MediaType} from "@/lib/utils/enums";
import {coercedPositiveIntFieldSchema, imageFileSchema, imageUrlSchema, mediaTypeFieldSchema, mediaTypeMediaIdSchema, paginationSchema} from "@/lib/schemas/common.schema";


export type UpdateBookCoverInput = z.input<typeof updateBookCoverSchema>;
export type EditMediaDetailsInput = z.input<typeof editMediaDetailsPayloadSchema>;
export type EditMediaDetailsPayload = z.output<typeof editMediaDetailsPayloadSchema>;
export type EditMediaDetailsPayloadByType = { [T in MediaType]: z.output<(typeof editMediaDetailsPayloadSchemas)[T]> };


export const mediaDetailsSchema = mediaTypeMediaIdSchema;

export const mediaCommunityActivitySchema = mediaDetailsSchema.extend({
    search: paginationSchema,
});

export const externalMediaResolveSchema = z.object({
    apiId: z.coerce.string(),
    mediaType: mediaTypeFieldSchema,
});

export const refreshMediaDetailsSchema = mediaTypeMediaIdSchema;

export const mediaDetailsToEditSchema = mediaTypeMediaIdSchema;


const metadataTextSchema = z.string().nullable().optional();
const metadataNumberSchema = z.union([z.number(), z.string().trim().min(1)])
    .pipe(z.coerce.number<string | number>().nonnegative());

const metadataIntegerSchema = metadataNumberSchema.pipe(z.number().int());
const blankMetadataFieldSchema = z.string().trim().length(0).transform(() => null);
const metadataDateSchema = z.union([z.iso.date(), blankMetadataFieldSchema]).nullable().optional();
const commonEditableFields = { name: true, releaseDate: true, synopsis: true, lockStatus: true, imageCover: true } as const;


export const editMediaDetailsPayloadSchema = z.strictObject({
    tagline: metadataTextSchema,
    synopsis: metadataTextSchema,
    language: metadataTextSchema,
    createdBy: metadataTextSchema,
    gameModes: metadataTextSchema,
    prodStatus: metadataTextSchema,
    gameEngine: metadataTextSchema,
    publishers: metadataTextSchema,
    authors: z.string().optional(),
    releaseDate: metadataDateSchema,
    lastAirDate: metadataDateSchema,
    originalName: metadataTextSchema,
    directorName: metadataTextSchema,
    originCountry: metadataTextSchema,
    originalLanguage: metadataTextSchema,
    playerPerspective: metadataTextSchema,
    pages: metadataIntegerSchema.optional(),
    duration: metadataIntegerSchema.optional(),
    name: z.string().trim().min(1, "Name is required.").optional(),
    homepage: z.union([imageUrlSchema, blankMetadataFieldSchema]).nullable().optional(),
    budget: z.union([metadataNumberSchema, blankMetadataFieldSchema]).nullable().optional(),
    revenue: z.union([metadataNumberSchema, blankMetadataFieldSchema]).nullable().optional(),
    chapters: z.union([metadataIntegerSchema, blankMetadataFieldSchema]).nullable().optional(),
    hltbMainTime: z.union([metadataNumberSchema, blankMetadataFieldSchema]).nullable().optional(),
    hltbMainAndExtraTime: z.union([metadataNumberSchema, blankMetadataFieldSchema]).nullable().optional(),
    hltbTotalCompleteTime: z.union([metadataNumberSchema, blankMetadataFieldSchema]).nullable().optional(),
    imageCover: z.union([imageUrlSchema, z.string().trim().length(0).transform(() => undefined)]).optional(),
    genres: z.array(z.union([
        z.string().trim().min(1),
        z.strictObject({ name: z.string().trim().min(1) }),
    ])).optional(),
    lockStatus: z.union([
        z.boolean(),
        z.literal("true").transform(() => true),
        z.literal("false").transform(() => false),
        blankMetadataFieldSchema,
    ]).nullable().optional(),
});


const tvEditPayloadSchema = editMediaDetailsPayloadSchema.pick({
    ...commonEditableFields,
    originalName: true, lastAirDate: true, homepage: true, createdBy: true, duration: true, originCountry: true, prodStatus: true,
});


export const editMediaDetailsPayloadSchemas = {
    [MediaType.ANIME]: tvEditPayloadSchema,
    [MediaType.SERIES]: tvEditPayloadSchema,
    [MediaType.MOVIES]: editMediaDetailsPayloadSchema.pick({
        ...commonEditableFields,
        originalName: true, directorName: true, duration: true, budget: true,
        revenue: true, tagline: true, originalLanguage: true, homepage: true,
    }),
    [MediaType.GAMES]: editMediaDetailsPayloadSchema.pick({
        ...commonEditableFields,
        gameEngine: true, gameModes: true, playerPerspective: true,
        hltbMainTime: true, hltbMainAndExtraTime: true, hltbTotalCompleteTime: true,
    }),
    [MediaType.BOOKS]: editMediaDetailsPayloadSchema.pick({
        ...commonEditableFields, pages: true, language: true, publishers: true, authors: true,
    }),
    [MediaType.MANGA]: editMediaDetailsPayloadSchema.pick({
        ...commonEditableFields, chapters: true, publishers: true, genres: true,
    }),
};


export const editMediaDetailsSchema = z.discriminatedUnion("mediaType", [
    mediaTypeMediaIdSchema.extend({ mediaType: z.literal(MediaType.SERIES), payload: editMediaDetailsPayloadSchemas[MediaType.SERIES] }),
    mediaTypeMediaIdSchema.extend({ mediaType: z.literal(MediaType.ANIME), payload: editMediaDetailsPayloadSchemas[MediaType.ANIME] }),
    mediaTypeMediaIdSchema.extend({ mediaType: z.literal(MediaType.MOVIES), payload: editMediaDetailsPayloadSchemas[MediaType.MOVIES] }),
    mediaTypeMediaIdSchema.extend({ mediaType: z.literal(MediaType.GAMES), payload: editMediaDetailsPayloadSchemas[MediaType.GAMES] }),
    mediaTypeMediaIdSchema.extend({ mediaType: z.literal(MediaType.BOOKS), payload: editMediaDetailsPayloadSchemas[MediaType.BOOKS] }),
    mediaTypeMediaIdSchema.extend({ mediaType: z.literal(MediaType.MANGA), payload: editMediaDetailsPayloadSchemas[MediaType.MANGA] }),
]);

export const updateBookCoverSchema = z.object({
    imageUrl: imageUrlSchema.optional(),
    imageFile: imageFileSchema.optional(),
    mediaId: coercedPositiveIntFieldSchema,
}).superRefine((data, ctx) => {
    const addFieldIssues = (message: string) => {
        ctx.addIssue({ code: "custom", message, path: ["imageUrl"] });
        ctx.addIssue({ code: "custom", message, path: ["imageFile"] });
    };

    if (!data.imageUrl && !data.imageFile) {
        addFieldIssues("Provide an image link or upload a file.");
    }
    if (data.imageUrl && data.imageFile) {
        addFieldIssues("Please, choose only one cover option.");
    }
});


export const mediaDetailsJobSchema = z.object({
    name: z.string(),
    job: z.enum(JobType),
    mediaType: mediaTypeFieldSchema,
})


export const jobDetailsSchema = mediaDetailsJobSchema.extend({
    pagination: paginationSchema,
});
