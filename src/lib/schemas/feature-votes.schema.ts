import * as z from "zod";
import {FeatureStatus, FeatureVoteType} from "@/lib/utils/enums";


export const postFeatureRequestSchema = z.object({
    title: z.string().trim()
        .min(3, "Title must be at least 3 characters long")
        .max(80, "Title is too long (max 80 characters)"),
    description: z.string().trim()
        .max(400, "Description cannot exceed 400 characters")
        .optional(),
});

export const postFeatureVoteSchema = z.object({
    voteType: z.enum(FeatureVoteType),
    featureId: z.coerce.number().int().positive(),
});

export const postFeatureStatusSchema = z.object({
    status: z.enum(FeatureStatus),
    featureId: z.coerce.number().int().positive(),
    adminComment: z.string().trim().optional().nullable(),
});

export const postFeatureDeleteSchema = z.object({
    featureId: z.coerce.number().int().positive(),
});
