import {Column, SQL} from "drizzle-orm";
import {taskDefinitions} from "@/cli/commands";
import {DeltaStats} from "@/lib/types/stats.types";
import {MediaTable} from "@/lib/types/media.config.types";
import {MediaListArgs} from "@/lib/types/zod.schema.types";
import {SQLiteColumn, SQLiteTable} from "drizzle-orm/sqlite-core";
import {ListFiltersOptionsType} from "@/lib/types/query.options.types";
import {GamesPlatformsEnum, JobType, MediaType, NotificationType, RatingSystemType, Status, UpdateType} from "@/lib/server/utils/enums";


export type CoverType = "series-covers" | "anime-covers" | "movies-covers" | "games-covers" | "books-covers" | "manga-covers" |
    "profile-covers" | "profile-back-covers";


export type StatusPayload = {
    status: Status,
}

export type PagePayload = {
    actualPage: number,
}

export type ChapterPayload = {
    currentChapter: number,
}

export type RedoPayload = {
    redo: number,
}

export type RedoTvPayload = {
    redo: number[],
}

export type EpsSeasonPayload = {
    currentSeason?: number,
    lastEpisodeWatched?: number,
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

export type AddedMediaDetails = {
    genres: IdNamePair[];
    actors?: IdNamePair[];
    authors?: IdNamePair[];
    networks?: IdNamePair[];
    platforms?: IdNamePair[];
    epsPerSeason?: EpsPerSeasonType;
    collection?: { mediaId: number, mediaName: string, mediaCover: string }[];
    companies?: { id: number, name: string, developer: boolean, publisher: boolean }[];
};

export type ExpandedListFilters = {
    genres: NameObj[];
    labels: NameObj[];
    langs?: NameObj[];
    platforms?: { name: GamesPlatformsEnum }[];
};

export type TopMetricStats = {
    topValues: NameValuePair[];
    topRated: NameValuePair[];
    topFavorited: NameValuePair[];
};

export type UserMediaWithLabels<TList> = TList & {
    labels: NameObj[],
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
        labels: IdNamePair[];
        ratingSystem: RatingSystemType;
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

export type MediaAndUserDetails<TMedia, TList> = {
    similarMedia: SimpleMedia[];
    media: TMedia & AddedMediaDetails;
    followsData: UserFollowsMediaData<TList>[];
    userMedia: UserMediaWithLabels<TList> | null;
}

export type UpdateUserMediaDetails<TMedia, TList> = {
    media: TMedia;
    newState: TList;
    delta: DeltaStats;
    logPayload: LogPayload;
}

export type SimpleMedia = {
    mediaId: number,
    mediaName: string,
    mediaCover: string,
}

export type TopMetricObject = {
    limit?: number,
    filters: SQL[],
    minRatingCount?: number,
    metricTable: SQLiteTable,
    metricIdCol: SQLiteColumn,
    mediaLinkCol: SQLiteColumn,
    metricNameCol: SQLiteColumn,
}

export type LogPayloadDb = { old_value: any; new_value: any };

export type UpdatePayload = {
    payload: {
        type: UpdateType;
        [key: string]: any;
    }
}

export type Label = { oldName?: string, name: string };

export type SheetFilterObject = {
    job?: JobType;
    title: string;
    key: keyof MediaListArgs;
    type: "checkbox" | "search";
    renderLabel?: (name: string, mediaType: MediaType) => string;
    getItems?: (data: ListFiltersOptionsType) => { name: string }[] | undefined;
};

export type UpdateHandlerFn<TState, TPayload, TMedia> =
    (currentState: TState, payload: TPayload, media: TMedia) => [TState, LogPayload] | Promise<[TState, LogPayload]>;

export type ListFilterDefinition = {
    mediaTable: MediaTable;
    filterColumn: SQLiteColumn;
    argName: keyof MediaListArgs;
    entityTable?: SQLiteTable & { mediaId: Column<any, any, any> };
}

export type FilterDefinition = {
    isActive: (args: MediaListArgs) => boolean;
    getCondition: (args: MediaListArgs) => SQL | undefined;
}

export type FilterDefinitions = Partial<Record<keyof MediaListArgs, FilterDefinition>>;

export type NameValuePair = { name: string | number, value: number };

export type EpsPerSeasonType = { season: number, episodes: number }[];

export type AdvancedMediaStats = {
    totalLabels: number,
    avgDuration: number;
    ratings: NameValuePair[],
    genresStats: TopMetricStats,
    releaseDates: NameValuePair[],
    durationDistrib: NameValuePair[];
}

export type LogPayload = { oldValue: any; newValue: any } | null;

export type TasksName = (typeof taskDefinitions)[number]["name"];

export type StatsCTE = any;

type NameObj = { name: string };

type IdNamePair = { id: number, name: string };

type NotificationPayload = {
    name: string;
    final?: boolean;
    season?: number | null;
    episode?: number | null;
    releaseDate: string | null;
};
