import * as z from "zod";
import {MediaType} from "@/lib/utils/enums";


export type SearchType = z.infer<typeof searchTypeSchema>;


export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().max(50).optional().catch(undefined),
});

export const searchTypeSchema = paginationSchema.extend({
    sortDesc: z.boolean().optional().catch(true),
    search: z.string().optional().catch(undefined),
    sorting: z.string().optional().catch(undefined),
    total: z.coerce.number().int().positive().optional().catch(undefined),
});

export const mediaActionSchema = z.object({
    mediaType: z.enum(MediaType),
    mediaId: z.coerce.number().int().positive(),
});

export const tagSchema = z.object({
    name: z.string(),
    oldName: z.string().optional(),
});

export const baseUsernameSchema = z.looseObject({
    username: z.string(),
});
