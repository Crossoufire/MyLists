import {Column, SQL} from "drizzle-orm";
import {DeltaStats} from "@/lib/server/types/stats.types";
import {SQLiteColumn, SQLiteTable} from "drizzle-orm/sqlite-core";
import {authOptions} from "@/lib/react-query/query-options/query-options";
import {MediaListArgs, MediaTable} from "@/lib/server/types/media-lists.types";
import {GamesPlatformsEnum, MediaType, NotificationType, RatingSystemType} from "@/lib/server/utils/enums";
import {Label} from "@/lib/components/types";


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


export type ItemForNotification = {
    userId: number;
    mediaId: number;
    mediaName: string;
    releaseDate: string | null;
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
    networks?: { id: number, name: string }[];
    platforms?: { id: number, name: string }[];
    epsPerSeason?: { season: number, episodes: number }[];
    collection?: { mediaId: number, mediaName: string, mediaCover: string }[];
    companies?: { id: number, name: string, developer: boolean, publisher: boolean }[];
};


export type CommonListFilters = {
    genres: { name: string | null }[];
    labels: { name: string | null }[];
};


export type ExpandedListFilters = CommonListFilters & {
    langs?: { name: string | null }[];
    countries?: { name: string | null }[];
    platforms?: { name: GamesPlatformsEnum | null }[];
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


export type MediaListData = {
    items: {
        [p: string]: any;
        common: boolean;
        ratingSystem: RatingSystemType;
    }[];
    pagination: {
        page: number;
        perPage: number;
        sorting: string;
        totalPages: number;
        totalItems: number;
        availableSorting: string[];
    };
}


export type EditUserLabels = {
    label: Label;
    userId: number;
    mediaId: number;
    action: "add" | "rename" | "deleteOne" | "deleteAll";
}


export type ConfigTopMetric = {
    limit?: number,
    minRatingCount?: number,
    filters: SQL[],
    metricTable: SQLiteTable,
    metricIdColumn: SQLiteColumn,
    mediaLinkColumn: SQLiteColumn,
    metricNameColumn: SQLiteColumn,
}


export type AdvancedMediaStats = {
    totalLabels: number,
    ratings: NameValuePair[],
    genresStats: TopMetricStats,
    releaseDates: NameValuePair[],
    durationDistrib: NameValuePair[];
    avgDuration: number | null | undefined;

    // TMDB Specifics
    actorsStats?: TopMetricStats;

    // Movies Specifics
    langsStats?: TopMetricStats
    directorsStats?: TopMetricStats;
    totalBudget?: number | undefined,
    totalRevenue?: number | null | undefined;

    // Games Specifics


    // TV Specifics
    networksStats?: TopMetricStats;
    countriesStats?: TopMetricStats;
    totalSeasons?: number | null | undefined;
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


export type UpdateUserMediaDetails<TMedia, TList> = {
    os: UserMediaWithLabels<TList>;
    ns: TList;
    media: TMedia;
    delta: DeltaStats;
    updateData: Record<string, any>;
}


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


export type FilterDefinitions = Partial<Record<keyof MediaListArgs, FilterDefinition>>;


export type CurrentUser = ReturnType<typeof authOptions>["queryFn"];
export type EpsPerSeasonType = { season: number, episodes: number }[];
type NameValuePair = { name: string | number, value: number };
export type HofSorting = "normalized" | "profile" | MediaType;
export type SearchTypeHoF = SearchType & Omit<SearchType, "sorting"> & { sorting?: HofSorting };

export type SearchType = {
    page?: number;
    search?: string;
    sorting?: string;
    perPage?: number;
}