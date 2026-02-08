import * as z from "zod";
import {
    AchievementDifficulty,
    ApiProviderType,
    CollectionAction,
    FeatureStatus,
    FeatureVoteType,
    GamesPlatformsEnum,
    JobType,
    MediaType,
    PrivacyType,
    RatingSystemType,
    RoleType,
    Status,
    UpdateType
} from "@/lib/utils/enums";


export type SearchType = z.infer<typeof searchTypeSchema>;
export type MediaListArgs = z.infer<typeof mediaListArgsSchema>;
export type ListSettings = z.infer<typeof mediaListSettingsSchema>;
export type AdminUpdatePayload = z.infer<typeof adminUpdatePayloadSchema>;
export type AchievementTier = z.infer<typeof tierAchievementSchema>;
export type UpdateUserMedia = z.infer<typeof updateUserMediaSchema>;
export type SectionActivity = z.infer<typeof getSectionActivitySchema>;

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().max(50).optional().catch(undefined),
});

export const searchTypeSchema = paginationSchema.extend({
    sortDesc: z.boolean().optional().catch(true),
    search: z.string().optional().catch(undefined),
    sorting: z.string().optional().catch(undefined),
    total: z.coerce.number().int().positive().optional().catch(undefined),
});

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

const mediaListArgsSchema = paginationSchema.extend({
    search: z.string().optional().catch(undefined),
    sorting: z.string().optional().catch(undefined),
    currentUserId: z.coerce.number().int().optional().catch(undefined),
    userId: z.coerce.number().int().optional().catch(undefined),
    favorite: z.coerce.boolean().optional().catch(undefined),
    comment: z.coerce.boolean().optional().catch(undefined),
    hideCommon: z.coerce.boolean().optional().catch(undefined),
    status: z.array(z.enum(Status)).optional().catch(undefined),
    genres: z.array(z.string()).optional().catch(undefined),
    collections: z.array(z.string()).optional().catch(undefined),
    langs: z.array(z.string()).optional().catch(undefined),
    directors: z.array(z.string()).optional().catch(undefined),
    publishers: z.array(z.string()).optional().catch(undefined),
    actors: z.array(z.string()).optional().catch(undefined),
    authors: z.array(z.string()).optional().catch(undefined),
    companies: z.array(z.string()).optional().catch(undefined),
    networks: z.array(z.string()).optional().catch(undefined),
    creators: z.array(z.string()).optional().catch(undefined),
    platforms: z.array(z.enum(GamesPlatformsEnum)).optional().catch(undefined),
});

export const mediaListSchema = z.object({
    mediaType: z.enum(MediaType),
    args: mediaListArgsSchema,
});

export const mediaListFiltersSchema = z.looseObject({
    mediaType: z.enum(MediaType),
});

export const mediaListSearchFiltersSchema = z.looseObject({
    job: z.enum(JobType),
    mediaType: z.enum(MediaType),
    query: z.string().min(1),
});

export const mediadleSuggestionsSchema = z.object({
    query: z.string(),
});

export const addMediadleGuessSchema = z.object({
    guess: z.string(),
});

export const platformStatsSchema = z.object({
    mediaType: z.enum(MediaType).optional(),
});

export const navbarSearchSchema = z.object({
    query: z.string(),
    apiProvider: z.enum(ApiProviderType),
    page: z.coerce.number().int().positive(),
});

const collectionSchema = z.object({
    name: z.string(),
    oldName: z.string().optional(),
});

export const mediaActionSchema = z.object({
    mediaType: z.enum(MediaType),
    mediaId: z.coerce.number().int().positive(),
});

export const addMediaToListSchema = z.object({
    mediaType: z.enum(MediaType),
    status: z.enum(Status).optional(),
    mediaId: z.coerce.number().int().positive(),
});

export const updateUserMediaSchema = z.object({
    mediaType: z.enum(MediaType),
    mediaId: z.coerce.number().int().positive(),
    payload: z.object({
        type: z.enum(UpdateType),
        favorite: z.boolean().optional(),
        status: z.enum(Status).optional(),
        comment: z.string().nullish().optional(),
        redo: z.number().int().min(0).optional(),
        actualPage: z.number().int().min(0).optional(),
        currentSeason: z.number().int().min(1).optional(),
        currentChapter: z.number().int().min(0).optional(),
        redo2: z.array(z.number().int().min(0)).optional(),
        currentEpisode: z.number().int().min(0).optional(),
        platform: z.enum(GamesPlatformsEnum).optional().nullable(),
        playtime: z.number().min(0).max(15000 * 60).optional(),
        rating: z.number().min(0).max(10).optional().nullable(),
    }).refine((data) => {
        const definedFields = Object.entries(data)
            .filter(([key, value]) => key !== "type" && value !== undefined)
            .map(([key, _]) => key);
        return definedFields.length === 1;
    }, {
        message: "Exactly one field (besides type) must be provided in the payload."
    })
});

export const deleteUserUpdatesSchema = z.object({
    returnData: z.coerce.boolean().default(false),
    updateIds: z.array(z.number().int().positive()),
});

export const userCollectionNamesSchema = z.object({
    mediaType: z.enum(MediaType),
});

export const editUserCollectionSchema = z.object({
    collection: collectionSchema,
    mediaType: z.enum(MediaType),
    action: z.enum(CollectionAction),
    mediaId: z.coerce.number().int().positive().optional(),
});

export const baseUsernameSchema = z.looseObject({
    username: z.string(),
});

export const allUpdatesHistorySchema = searchTypeSchema.extend({
    username: z.string(),
});


export const respondToFollowRequest = z.object({
    action: z.enum(["accept", "decline"]),
    followerId: z.coerce.number().int().positive(),
});

export const generalSettingsSchema = z.object({
    profileImage: z.instanceof(File).optional(),
    backgroundImage: z.instanceof(File).optional(),
    privacy: z.enum(PrivacyType),
    username: z.string().trim()
        .min(3, "Username too short (3 min)")
        .max(15, "Username too long (15 max)"),
});

export const mediaListSettingsSchema = z.object({
    anime: z.boolean(),
    games: z.boolean(),
    manga: z.boolean(),
    books: z.boolean(),
    gridListView: z.boolean(),
    searchSelector: z.enum(ApiProviderType),
    ratingSystem: z.enum(RatingSystemType),
});

export const passwordSettingsSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Password too short (8 min)").max(50, "Password too long (50 max)"),
});

export const downloadListAsCsvSchema = z.object({
    selectedList: z.enum(MediaType),
});

export const getUserStatsSchema = z.object({
    mediaType: z.enum(MediaType).optional(),
})

export const getMonthlyActivitySchema = z.object({
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


const adminUpdatePayloadSchema = z.object({
    role: z.enum(RoleType).optional(),
    deleteUser: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    privacy: z.enum(PrivacyType).optional(),
    showOnboarding: z.boolean().optional(),
    showUpdateModal: z.boolean().optional(),
});

export const postAdminUpdateUserSchema = z.object({
    userId: z.number().int().positive().optional(),
    payload: adminUpdatePayloadSchema,
});

export const adminUpdateAchievementSchema = z.object({
    achievementId: z.number().int().positive(),
    name: z.string(),
    description: z.string(),
});

const tierAchievementSchema = z.object({
    id: z.number(),
    achievementId: z.number(),
    rarity: z.number().nullable(),
    difficulty: z.enum(AchievementDifficulty),
    criteria: z.object({
        count: z.number(),
    }),
});

export const postAdminUpdateTiersSchema = z.object({
    tiers: z.array(tierAchievementSchema),
});

export const adminTriggerTaskSchema = z.object({
    taskName: z.string(),
    input: z.record(z.any(), z.any()),
});

export const adminDeleteArchivedTaskSchema = z.object({
    taskId: z.string(),
});

export const adminDeleteErrorLogSchema = z.object({
    errorIds: z.array(z.number()).nullable(),
});

export const llmResponseSchema = z.array(z.object({
    bookApiId: z.string(),
    genres: z.array(z.string()),
}));

export const adminRefreshSchema = z.object({
    days: z.coerce.number().int().min(1).max(90).default(30),
    topLimit: z.coerce.number().int().min(1).max(20).default(8),
    recentLimit: z.coerce.number().int().min(1).max(30).default(12),
})

export const postFeatureRequestSchema = z.object({
    title: z.string().trim()
        .min(3, "Title must be at least 3 characters long")
        .max(80, "Title is too long (maximum 80 characters)"),
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
    adminComment: z.string().trim().max(300).optional().nullable(),
});

export const postFeatureDeleteSchema = z.object({
    featureId: z.coerce.number().int().positive(),
});
