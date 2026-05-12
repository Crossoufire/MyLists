import * as z from "zod";
import {MediaType} from "@/lib/utils/enums";


export type SectionActivity = z.infer<typeof getSectionActivitySchema>;
export type SpecificActivityFilters = z.infer<typeof getSpecificActivitySchema>;


export const getUserStatsSchema = z.object({
    mediaType: z.enum(MediaType).optional(),
})

export const monthlyActivitySchema = z.object({
    username: z.string(),
    year: z.coerce.number().int().positive(),
    month: z.coerce.number().int().positive().min(1).max(12),
})

export const getSectionActivitySchema = z.object({
    username: z.string(),
    mediaType: z.enum(MediaType).optional(),
    year: z.coerce.number().int().positive(),
    section: z.enum(["completed", "progressed", "redo"]),
    limit: z.coerce.number().optional().default(24),
    offset: z.coerce.number().optional().default(0),
    month: z.coerce.number().int().positive().min(1).max(12),
});

export const getSpecificActivitySchema = z.object({
    username: z.string(),
    mediaType: z.enum(MediaType),
    year: z.coerce.number().int().positive(),
    mediaId: z.coerce.number().int().positive(),
    month: z.coerce.number().int().positive().min(1).max(12),
});

export const updateActivitySchema = z.object({
    activityId: z.coerce.number().int().positive(),
    payload: z.object({
        isRedo: z.boolean().optional(),
        lastUpdate: z.string().optional(),
        isCompleted: z.boolean().optional(),
        specificGained: z.number().min(0).optional(),
    }).refine((data) => Object.values(data).some((val) => val !== undefined), {
        message: "Provide at least one field to update.",
    }),
});

export const deleteActivitySchema = z.object({
    activityId: z.coerce.number().int().positive(),
});
