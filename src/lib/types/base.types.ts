import {Column, SQL} from "drizzle-orm";
import {DeltaStats} from "@/lib/types/stats.types";
import {MediaTable} from "@/lib/types/media.config.types";
import {MediaListArgs} from "@/lib/types/zod.schema.types";
import {SQLiteColumn, SQLiteTable} from "drizzle-orm/sqlite-core";
import {ListFiltersOptionsType} from "@/lib/types/query.options.types";
import {GamesPlatformsEnum, JobType, MediaType, NotificationType, RatingSystemType, Status, UpdateType} from "@/lib/utils/enums";


export type CoverType = "series-covers" | "anime-covers" | "movies-covers" | "games-covers" | "books-covers" | "manga-covers" |
    "profile-covers" | "profile-back-covers";

export type UpdatePayload = {
    payload: {
        type: UpdateType;
    } & (CommentPayload | PlatformPayload | RatingPayload | FavoritePayload |
        PlaytimePayload | StatusPayload | PagePayload | ChapterPayload | RedoPayload |
        RedoTvPayload | EpsSeasonPayload);
}

export type CommentPayload = {
    comment: string | null | undefined,
}

export type PlatformPayload = {
    platform: GamesPlatformsEnum | null,
}

export type RatingPayload = {
    rating: number | null,
}

export type FavoritePayload = {
    favorite: boolean,
}

export type PlaytimePayload = {
    playtime: number,
}

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
    redo2: number[],
}

export type EpsSeasonPayload = {
    currentSeason?: number,
    currentEpisode?: number,
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
    statusCounts: Record<Status, number>;
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
    epsPerSeason?: EpsPerSeasonType[];
    providerData: { name: string, url: string };
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
    topRated: NameValuePair[];
    topValues: NameValuePair[];
    topFavorited: NameValuePair[];
};

export type UserMediaWithLabels<TList> = TList & {
    labels: NameObj[],
    ratingSystem: RatingSystemType,
};

export type UserFollowsMediaData<TList> = {
    id: number;
    name: string;
    userMedia: TList;
    image: string | null;
    ratingSystem: RatingSystemType;
}

export type MediaListData<TList> = {
    items: (TList & {
        pages?: number;
        common: boolean;
        mediaName: string;
        chapters?: number;
        imageCover: string;
        labels: IdNamePair[];
        ratingSystem: RatingSystemType;
        epsPerSeason?: EpsPerSeasonType[];
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

export type LogPayloadDb = { old_value: any; new_value: any };

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

export type NameValuePair = { name: string | number, value: number | string };

export type EpsPerSeasonType = { season: number, episodes: number };

export type AdvancedMediaStats = {
    totalLabels: number,
    ratings: NameValuePair[],
    avgDuration: number | null;
    genresStats: TopMetricStats,
    releaseDates: NameValuePair[],
    durationDistrib: NameValuePair[];
}

export type LogPayload = { oldValue: any; newValue: any } | null;

export type LogUpdateParams = {
    media: any;
    userId: number;
    mediaType: MediaType;
    payload: LogPayloadDb;
    updateType: UpdateType;
};

export type ErrorLog = {
    name: string,
    message: string,
    stack: string | null,
}

export type StatsCTE = any;

export type NameObj = { name: string };

type IdNamePair = { id: number, name: string };

type NotificationPayload = {
    name: string;
    final?: boolean;
    season?: number | null;
    episode?: number | null;
    release_date: string | null;
};
