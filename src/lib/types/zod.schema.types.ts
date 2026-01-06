import * as z from "zod";
import {
    AchievementDifficulty,
    ApiProviderType,
    GamesPlatformsEnum,
    JobType,
    LabelAction,
    MediaType,
    PrivacyType,
    RatingSystemType,
    RoleType,
    Status,
    UpdateType
} from "@/lib/utils/enums";
import {taskNames} from "@/lib/server/tasks/registry";


export type SearchType = z.infer<typeof searchTypeSchema>;
export type HofSorting = z.infer<typeof hofSortingSchema>;
export type SearchTypeHoF = z.infer<typeof searchTypeHoFSchema>;
export type SearchTypeAdmin = z.infer<typeof searchTypeAdminSchema>;
export type MediaListArgs = z.infer<typeof mediaListArgsSchema>;
export type ListSettings = z.infer<typeof mediaListSettingsSchema>;
export type AllUpdatesSearch = z.infer<typeof allUpdatesHistorySchema>;
export type AdminUpdatePayload = z.infer<typeof adminUpdatePayloadSchema>;
export type AchievementTier = z.infer<typeof tierAchievementSchema>;
export type UpdateUserMedia = z.infer<typeof updateUserMediaSchema>;


export const hofSortingSchema = z.enum(["normalized", "profile", ...Object.values(MediaType)] as const).optional().catch("normalized");

export const searchTypeSchema = z.object({
    search: z.string().optional().catch(undefined),
    sorting: z.string().optional().catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().optional().catch(undefined),
});

export const searchTypeHoFSchema = searchTypeSchema.extend({
    sorting: hofSortingSchema,
});

export const searchTypeAdminSchema = searchTypeSchema.extend({
    total: z.coerce.number().int().positive().optional().catch(undefined),
    sortDesc: z.boolean().optional().catch(true),
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

export const jobDetailsSchema = z.object({
    name: z.string(),
    job: z.enum(JobType),
    search: searchTypeSchema,
    mediaType: z.enum(MediaType),
});

export const mediaListArgsSchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().optional().catch(undefined),
    search: z.string().optional().catch(undefined),
    sort: z.string().optional().catch(undefined),
    sorting: z.string().optional().catch(undefined),
    currentUserId: z.coerce.number().int().optional().catch(undefined),
    userId: z.coerce.number().int().optional().catch(undefined),
    favorite: z.coerce.boolean().optional().catch(undefined),
    comment: z.coerce.boolean().optional().catch(undefined),
    hideCommon: z.coerce.boolean().optional().catch(undefined),
    status: z.array(z.enum(Status)).optional().catch(undefined),
    genres: z.array(z.string()).optional().catch(undefined),
    labels: z.array(z.string()).optional().catch(undefined),
    langs: z.array(z.string()).optional().catch(undefined),
    directors: z.array(z.string()).optional().catch(undefined),
    publishers: z.array(z.string()).optional().catch(undefined),
    actors: z.array(z.string()).optional().catch(undefined),
    authors: z.array(z.string()).optional().catch(undefined),
    companies: z.array(z.string()).optional().catch(undefined),
    networks: z.array(z.string()).optional().catch(undefined),
    creators: z.array(z.string()).optional().catch(undefined),
    platforms: z.array(z.enum(GamesPlatformsEnum)).optional().catch(undefined),
})
export const mediaListSchema = z.object({
    mediaType: z.enum(MediaType),
    args: mediaListArgsSchema,
});

export const mediaListFiltersSchema = z.object({
    mediaType: z.enum(MediaType),
});

export const mediaListSearchFiltersSchema = z.object({
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
    mediaType: z.enum(MediaType).optional().catch(undefined),
});

export const navbarSearchSchema = z.object({
    query: z.string().catch(""),
    page: z.coerce.number().int().positive().catch(1),
    apiProvider: z.enum(ApiProviderType).catch(ApiProviderType.TMDB),
});

export const labelSchema = z.object({
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
        playtime: z.number().min(0).optional(),
        redo: z.number().int().min(0).optional(),
        actualPage: z.number().int().min(0).optional(),
        currentSeason: z.number().int().min(1).optional(),
        currentChapter: z.number().int().min(0).optional(),
        redo2: z.array(z.number().int().min(0)).optional(),
        currentEpisode: z.number().int().min(0).optional(),
        platform: z.enum(GamesPlatformsEnum).optional().nullable(),
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

export const userMediaLabelsSchema = z.object({
    mediaType: z.enum(MediaType),
});

export const editUserLabelSchema = z.object({
    label: labelSchema,
    action: z.enum(LabelAction),
    mediaType: z.enum(MediaType),
    mediaId: z.coerce.number().int().positive(),
});

export const baseUsernameSchema = z.looseObject({
    username: z.string(),
});

export const allUpdatesHistorySchema = searchTypeSchema.extend({
    username: z.string(),
});

export const updateFollowStatusSchema = z.object({
    followStatus: z.boolean(),
    followId: z.coerce.number().int(),
});

export const generalSettingsSchema = z.object({
    profileImage: z.instanceof(File).optional(),
    backgroundImage: z.instanceof(File).optional(),
    privacy: z.enum(Object.values(PrivacyType) as [PrivacyType, ...PrivacyType[]]),
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
    searchSelector: z.enum(Object.values(ApiProviderType) as [ApiProviderType, ...ApiProviderType[]]),
    ratingSystem: z.enum(Object.values(RatingSystemType) as [RatingSystemType, ...RatingSystemType[]]),
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

const adminUpdatePayloadSchema = z.object({
    role: z.enum(RoleType).optional(),
    deleteUser: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    privacy: z.enum(PrivacyType).optional(),
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
    input: z.looseObject({}),
    taskName: z.lazy(() => z.enum(taskNames)),
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
