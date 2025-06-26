import {GamesPlatformsEnum, MediaType, NotificationType} from "@/lib/server/utils/enums";


export type ComingNext = {
    mediaId: number,
    mediaName: string,
    imageCover: string,
    date: string | null,
    episodeToAir?: number | null,
    seasonToAir?: number | null,
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
    items: {
        mediaId: number,
        mediaName: string,
        imageCover: string,
        inUserList: boolean,
    }[];
    total: number;
    pages: number;
};


export type AddedMediaDetails = {
    genres?: { id: number, name: string }[];
    actors?: { id: number, name: string }[];
    networks?: { id: number, name: string }[];
    companies?: { id: number, name: string }[];
    platforms?: { id: number, name: string }[];
    epsPerSeason?: { season: number, episodes: number }[];
    collection?: { id: number, name: string, imageCover: string }[];
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
