import * as z from "zod/v4";
import {Column, SQL} from "drizzle-orm";
import {taskNames} from "@/cli/commands";
import {JobType as MqJobType} from "bullmq";
import {DeltaStats} from "@/lib/server/types/stats.types";
import {MediaTable} from "@/lib/server/types/media-lists.types";
import {SQLiteColumn, SQLiteTable} from "drizzle-orm/sqlite-core";
import {authOptions} from "@/lib/react-query/query-options/query-options";
import {
    AchievementDifficulty,
    ApiProviderType,
    GamesPlatformsEnum,
    JobType,
    LabelAction,
    MediaType,
    NotificationType,
    PrivacyType,
    RatingSystemType,
    RoleType,
    Status,
    UpdateType
} from "@/lib/server/utils/enums";


export type StatusPayload = {
    status: Status,
    type: typeof UpdateType.STATUS,
}


export type RedoPayload = {
    redo: number,
    type: typeof UpdateType.REDO,
}

export type RedoTvPayload = {
    redo: number[],
    type: typeof UpdateType.REDO,
}

export type EpsSeasonPayload = {
    currentSeason?: number,
    type: typeof UpdateType.TV,
    lastEpisodeWatched?: number,
}

export type ComingNext = {
    mediaId: number,
    mediaName: string,
    imageCover: string,
    date: string | null,
    seasonToAir?: number | null,
    episodeToAir?: number | null,
}


export type UserMediaStats = {
    userId: number;
    timeSpent: number;
    totalRedo: number;
    totalEntries: number;
    entriesRated: number;
    totalSpecific: number;
    averageRating: number;
    sumEntriesRated: number;
    entriesFavorites: number;
    entriesCommented: number;
    statusCounts: Record<string, number>;
};


export type UpComingMedia = {
    userId: number;
    status: Status;
    mediaId: number;
    mediaName: string;
    imageCover: string;
    date: string | null;
    lastEpisode?: number | null;
    seasonToAir?: number | null;
    episodeToAir?: number | null;
};


export type UpdateMediaNotification = {
    userId: number,
    mediaId: number,
    mediaType: MediaType,
    payload: NotificationPayload,
    notificationType: NotificationType,
};


export type NotificationPayload = {
    name: string;
    final?: boolean;
    season?: number | null;
    episode?: number | null;
    releaseDate: string | null;
};


export type JobDetails = {
    items: JobDetail[];
    total: number;
    pages: number;
};


export type JobDetail = {
    mediaId: number,
    mediaName: string,
    imageCover: string,
    inUserList: boolean,
};


export type AddedMediaDetails = {
    genres: { id: number, name: string }[];
    actors?: { id: number, name: string }[];
    authors?: { id: number, name: string }[];
    networks?: { id: number, name: string }[];
    platforms?: { id: number, name: string }[];
    epsPerSeason?: { season: number, episodes: number }[];
    collection?: { mediaId: number, mediaName: string, mediaCover: string }[];
    companies?: { id: number, name: string, developer: boolean, publisher: boolean }[];
};


export type CommonListFilters = {
    genres: { name: string }[];
    labels: { name: string }[];
};


export type ExpandedListFilters = CommonListFilters & {
    langs?: { name: string }[];
    platforms?: { name: GamesPlatformsEnum }[];
};


export type TopMetricStats = {
    topValues: { name: string, value: number }[];
    topRated: { name: string, value: number }[];
    topFavorited: { name: string, value: number }[];
};


export type UserMediaWithLabels<TList> = TList & {
    labels: { name: string }[],
    ratingSystem: RatingSystemType,
};


export type UserFollowsMediaData<TList> = {
    id: number;
    name: string;
    image: string;
    userMedia: TList;
    ratingSystem: RatingSystemType;
}


export type MediaListData<TList> = {
    items: (TList & {
        common: boolean;
        mediaName: string;
        imageCover: string;
        ratingSystem: RatingSystemType;
        labels: { id: number, name: string }[];
    })[];
    pagination: {
        page: number;
        perPage: number;
        sorting: string;
        totalPages: number;
        totalItems: number;
        availableSorting: string[];
    };
}


export type ConfigTopMetric = {
    limit?: number,
    filters: SQL[],
    minRatingCount?: number,
    metricTable: SQLiteTable,
    metricIdCol: SQLiteColumn,
    mediaLinkCol: SQLiteColumn,
    metricNameCol: SQLiteColumn,
}


export type AdvancedMediaStats = {
    totalLabels: number,
    avgDuration: number;
    ratings: NameValuePair[],
    genresStats: TopMetricStats,
    releaseDates: NameValuePair[],
    durationDistrib: NameValuePair[];
}


export type MoviesAdvancedStats = AdvancedMediaStats & {
    langsStats: TopMetricStats;
    actorsStats: TopMetricStats;
    directorsStats: TopMetricStats;
    totalBudget: number | undefined,
    totalRevenue: number | null | undefined;
}


export type TvAdvancedStats = AdvancedMediaStats & {
    actorsStats: TopMetricStats;
    networksStats: TopMetricStats;
    countriesStats: TopMetricStats;
    totalSeasons: number | null | undefined;
}


export type GamesAdvancedStats = AdvancedMediaStats & {
    enginesStats: TopMetricStats;
    platformsStats: TopMetricStats;
    developersStats: TopMetricStats;
    publishersStats: TopMetricStats;
    perspectivesStats: TopMetricStats;
    gameModes: { topValues: { name: string, value: number }[] };
}


export type SimpleMedia = {
    mediaId: number,
    mediaName: string,
    mediaCover: string,
}


export type MediaAndUserDetails<TMedia, TList> = {
    similarMedia: SimpleMedia[];
    media: TMedia & AddedMediaDetails;
    followsData: UserFollowsMediaData<TList>[];
    userMedia: UserMediaWithLabels<TList> | null;
}


export type AddMediaToUserList<TMedia, TList> = {
    newState: TList;
    delta: DeltaStats;
    media: TMedia;
}


export type LogPayload = { oldValue: any; newValue: any } | null;


export type UpdateUserMediaDetails<TMedia, TList> = {
    media: TMedia;
    newState: TList;
    delta: DeltaStats;
    logPayload: LogPayload;
}


export type UpdateHandlerFn<TState, TPayload, TMedia> = (
    currentState: TState,
    payload: TPayload,
    media: TMedia,
) => [TState, LogPayload];


export type ListFilterDefinition = {
    mediaTable: MediaTable;
    entityTable: SQLiteTable & { mediaId: Column<any, any, any> };
    filterColumn: SQLiteColumn;
    argName: keyof MediaListArgs;
}


export type FilterDefinition = {
    isActive: (args: MediaListArgs) => boolean;
    getCondition: (args: MediaListArgs) => SQL | undefined;
}

export const mqJobTypes = [
    "completed",
    "waiting",
    "active",
    "delayed",
    "failed",
    "paused",
    "repeat",
    "wait"
] as const satisfies readonly MqJobType[];

export type FilterDefinitions = Partial<Record<keyof MediaListArgs, FilterDefinition>>;

export type StatsCTE = any;
export type NameValuePair = { name: string | number, value: number };
export type EpsPerSeasonType = { season: number, episodes: number }[];

export type CurrentUser = ReturnType<typeof authOptions>["queryFn"];

export type SearchType = z.infer<typeof searchTypeSchema>;
export type HofSorting = z.infer<typeof hofSortingSchema>;
export type SearchTypeHoF = z.infer<typeof searchTypeHoFSchema>;
export type SearchTypeAdmin = z.infer<typeof searchTypeAdminSchema>;
export type MediaListArgs = z.infer<typeof mediaListArgsSchema>;
export type ListSettings = z.infer<typeof mediaListSettingsSchema>;
export type AllUpdatesSearch = z.infer<typeof allUpdatesHistorySchema>;
export type AdminUpdatePayload = z.infer<typeof adminUpdatePayloadSchema>;
export type AchievementTier = z.infer<typeof tierAchievementSchema>;
// --- ZOD Schema -----------------------------------------------------------------------------------------------

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

export const plaftformStatsSchema = z.object({
    mediaType: z.enum(MediaType).optional().catch(undefined),
});

export const navbarSearchSchema = z.object({
    query: z.string(),
    apiProvider: z.enum(ApiProviderType),
    page: z.coerce.number().int().positive(),
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


const movieUpdatePayloads = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(UpdateType.STATUS),
        status: z.enum(Status),
    }),
    z.object({
        type: z.literal(UpdateType.REDO),
        redo: z.number().int().min(0),
    }),
    z.object({
        type: z.literal(UpdateType.RATING),
        rating: z.number().min(0).max(10),
    }),
    z.object({
        type: z.literal(UpdateType.COMMENT),
        comment: z.string().nullish(),
    }),
    z.object({
        type: z.literal(UpdateType.FAVORITE),
        favorite: z.boolean(),
    }),
]);
export type MovieUpdatePayload = z.infer<typeof movieUpdatePayloads>;

const gameUpdatePayloads = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(UpdateType.STATUS),
        status: z.enum(Status),
    }),
    z.object({
        type: z.literal(UpdateType.RATING),
        rating: z.number().min(0).max(10),
    }),
    z.object({
        type: z.literal(UpdateType.PLAYTIME),
        playtime: z.number().min(0).max(10_000),
    }),
    z.object({
        type: z.literal(UpdateType.PLATFORM),
        platform: z.enum(GamesPlatformsEnum),
    }),
    z.object({
        type: z.literal(UpdateType.COMMENT),
        comment: z.string().nullish(),
    }),
    z.object({
        type: z.literal(UpdateType.FAVORITE),
        favorite: z.boolean(),
    }),
]);
export type GameUpdatePayload = z.infer<typeof gameUpdatePayloads>;

const tvUpdatePayloads = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(UpdateType.STATUS),
        status: z.enum(Status),
    }),
    z.object({
        type: z.literal(UpdateType.REDO),
        redo: z.number().int().min(0),
    }),
    z.object({
        type: z.literal(UpdateType.TV),
        currentSeason: z.number().int().min(1).optional(),
        lastEpisodeWatched: z.number().int().min(0).optional(),
    }).refine((data) => data.currentSeason !== undefined || data.lastEpisodeWatched !== undefined, {
        message: "At least one of 'currentSeason' or 'lastEpisodeWatched' must be provided."
    }),
    z.object({
        type: z.literal(UpdateType.RATING),
        rating: z.number().min(0).max(10),
    }),
    z.object({
        type: z.literal(UpdateType.COMMENT),
        comment: z.string().nullish(),
    }),
    z.object({
        type: z.literal(UpdateType.FAVORITE),
        favorite: z.boolean(),
    }),
]);
export type TvUpdatePayload = z.infer<typeof tvUpdatePayloads>;


export const updateUserMediaSchema = z.object({
    mediaType: z.enum(MediaType),
    mediaId: z.coerce.number().int().positive(),
    payload: z.union([movieUpdatePayloads, tvUpdatePayloads]),
});
export type UpdateUserMedia = z.infer<typeof updateUserMediaSchema>;


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

export const postTriggerLongTasksSchema = z.object({
    taskName: z.enum(taskNames),
});

export const getAdminJobsSchema = z.object({
    types: z.array(z.enum(mqJobTypes)),
})

export const getAdminJobSchema = z.object({
    jobId: z.coerce.string(),
})