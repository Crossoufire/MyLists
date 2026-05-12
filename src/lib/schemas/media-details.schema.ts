import * as z from "zod";
import {JobType, MediaType} from "@/lib/utils/enums";
import {searchTypeSchema} from "@/lib/schemas/common.schema";


export const mediaDetailsSchema = z.object({
    external: z.boolean(),
    mediaId: z.coerce.string(),
    mediaType: z.enum(MediaType),
});

export const refreshMediaDetailsSchema = z.object({
    apiId: z.coerce.string(),
    mediaType: z.enum(MediaType),
});

export const mediaDetailsToEditSchema = z.object({
    mediaType: z.enum(MediaType),
    mediaId: z.coerce.number().int().positive(),
});

export const editMediaDetailsSchema = z.object({
    mediaType: z.enum(MediaType),
    payload: z.record(z.any(), z.any()),
    mediaId: z.coerce.number().int().positive(),
});

export const updateBookCoverSchema = z.object({
    apiId: z.coerce.string(),
    imageUrl: z.url().trim().optional(),
    imageFile: z.instanceof(File).optional(),
}).refine((data) => !!data.imageUrl || !!data.imageFile, {
    message: "Provide an image link or upload a file.",
}).refine((data) => !(data.imageUrl && data.imageFile), {
    message: "Please, choose only one cover option.",
});

export const jobDetailsSchema = z.object({
    name: z.string(),
    job: z.enum(JobType),
    search: searchTypeSchema,
    mediaType: z.enum(MediaType),
});
