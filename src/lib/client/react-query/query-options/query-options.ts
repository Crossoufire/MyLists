import {NotifTab} from "@/lib/types/base.types";
import {getCurrentUser} from "@/lib/server/functions/auth";
import {getTrendsMedia} from "@/lib/server/functions/trends";
import {CommunitySearch} from "@/lib/types/collections.types";
import {getSearchResults} from "@/lib/server/functions/search";
import {getHallOfFame} from "@/lib/server/functions/hall-of-fame";
import {getFeatureVotes} from "@/lib/server/functions/feature-votes";
import {getComingNextMedia} from "@/lib/server/functions/coming-next";
import {ApiProviderType, JobType, MediaType} from "@/lib/utils/enums";
import {getPlatformStats} from "@/lib/server/functions/platform-stats";
import {getAdminAllUpdatesHistory} from "@/lib/server/functions/admin";
import {MediaListArgs, SearchType} from "@/lib/types/zod.schema.types";
import {infiniteQueryOptions, queryOptions} from "@tanstack/react-query";
import {getUserAchievements} from "@/lib/server/functions/user-achievements";
import {getUserMediaHistory, getUserTagNames} from "@/lib/server/functions/user-media";
import {getDailyMediadle, getMediadleSuggestions} from "@/lib/server/functions/moviedle";
import {getNotifications, getNotificationsCount} from "@/lib/server/functions/notifications";
import {getMonthlyActivity, getSectionActivity, getUserStats} from "@/lib/server/functions/user-stats";
import {getJobDetails, getMediaDetails, getMediaDetailsToEdit} from "@/lib/server/functions/media-details";
import {getCommunityCollections, getEditCollectionDetails, getReadCollectionDetails, getUserCollections} from "@/lib/server/functions/collections";
import {getAllUpdatesHistory, getUserProfile, getUserProfileHeader, getUsersFollowers, getUsersFollows} from "@/lib/server/functions/user-profile";
import {getMediaListFilters, getMediaListSearchFilters, getMediaListSF, getTagsViewFn, getUserListHeaderSF} from "@/lib/server/functions/media-lists";


export const authOptions = queryOptions({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 10 * 60 * 1000,
});


export const upcomingOptions = queryOptions({
    queryKey: ["upcoming"],
    queryFn: () => getComingNextMedia(),
});


export const dailyMediadleOptions = queryOptions({
    queryKey: ["daily-mediadle"],
    queryFn: () => getDailyMediadle(),
});


export const notificationsCountOptions = queryOptions({
    queryKey: ["notification-counts"],
    queryFn: getNotificationsCount,
    refetchInterval: 30 * 60 * 1000,
    meta: { errorMessage: "An error occurred getting your notifications count" },
});


export const notificationsOptions = (open: boolean, activeTab: NotifTab) => queryOptions({
    queryKey: ["notifications", activeTab],
    queryFn: () => getNotifications({ data: { type: activeTab } }),
    meta: { errorMessage: "An error occurred fetching the notifications" },
    enabled: open,
});


export const trendsOptions = queryOptions({
    queryKey: ["trends"],
    queryFn: () => getTrendsMedia(),
    meta: { errorMessage: "An error occurred fetching the trends. Please try again later." },
});


export const profileHeaderOptions = (username: string) => queryOptions({
    queryKey: ["profile", "header", username],
    queryFn: () => getUserProfileHeader({ data: { username } }),
});


export const profileOptions = (username: string) => queryOptions({
    queryKey: ["profile", username],
    queryFn: () => getUserProfile({ data: { username } }),
});


export const navSearchOptions = (query: string, page: number, apiProvider: ApiProviderType) => queryOptions({
    queryKey: ["navSearch", query, page, apiProvider],
    queryFn: () => getSearchResults({ data: { query, page, apiProvider } }),
    staleTime: 1000 * 60 * 2,
    enabled: query?.trim().length >= 2,
});


export const mediaDetailsOptions = (mediaType: MediaType, mediaId: number | string, external: boolean) => queryOptions({
    queryKey: ["details", mediaType, mediaId, external] as const,
    queryFn: () => getMediaDetails({ data: { mediaType, mediaId, external } }),
    staleTime: 3 * 1000,
});


export const mediaListOptions = (mediaType: MediaType, username: string, search: MediaListArgs) => queryOptions({
    queryKey: ["userList", mediaType, username, search] as const,
    queryFn: () => getMediaListSF({ data: { mediaType, username, args: search } }),
});


export const userListHeaderOption = (mediaType: MediaType, username: string) => queryOptions({
    queryKey: ["userList", "header", username, mediaType] as const,
    queryFn: () => getUserListHeaderSF({ data: { mediaType, username } }),
});


export const tagsViewOptions = (mediaType: MediaType, username: string) => queryOptions({
    queryKey: ["tagsView", mediaType, username] as const,
    queryFn: () => getTagsViewFn({ data: { mediaType, username } }),
})


export const listFiltersOptions = (mediaType: MediaType, username: string) => queryOptions({
    queryKey: ["listFilters", mediaType, username],
    queryFn: () => getMediaListFilters({ data: { mediaType, username } }),
    staleTime: Infinity,
});


export const filterSearchOptions = (mediaType: MediaType, username: string, query: string, job: JobType) => queryOptions({
    queryKey: ["filterSearch", mediaType, username, query, job],
    queryFn: () => getMediaListSearchFilters({ data: { mediaType, username, query, job } }),
    staleTime: 2 * 60 * 1000,
    enabled: query.length >= 2,
});


export const followersOptions = (username: string) => queryOptions({
    queryKey: ["followers", username],
    queryFn: () => getUsersFollowers({ data: { username } }),
});


export const followsOptions = (username: string) => queryOptions({
    queryKey: ["follows", username],
    queryFn: () => getUsersFollows({ data: { username } }),
});


export const allUpdatesOptions = (username: string, filters: SearchType) => queryOptions({
    queryKey: ["allUpdates", username, filters],
    queryFn: () => getAllUpdatesHistory({ data: { ...filters, username } }),
});


export const adminAllUpdatesOptions = (filters: SearchType) => queryOptions({
    queryKey: ["adminAllUpdates", filters],
    queryFn: () => getAdminAllUpdatesHistory({ data: filters }),
});


export const historyOptions = (mediaType: MediaType, mediaId: number) => queryOptions({
    queryKey: ["onOpenHistory", mediaType, mediaId],
    queryFn: () => getUserMediaHistory({ data: { mediaType, mediaId } }),
    staleTime: 10 * 1000,
    placeholderData: [],
});


export const hallOfFameOptions = (search: SearchType) => queryOptions({
    queryKey: ["hof", search],
    queryFn: () => getHallOfFame({ data: search }),
});


export const mediadleSuggestionsOptions = (query: string) => queryOptions({
    queryKey: ["mediadleSuggestions", query],
    queryFn: () => getMediadleSuggestions({ data: { query } }),
    staleTime: 2 * 60 * 1000,
    enabled: query.length >= 2,
});


export const achievementOptions = (username: string) => queryOptions({
    queryKey: ["achievementPage", username],
    queryFn: () => getUserAchievements({ data: { username } }),
});


export const userStatsOptions = (username: string, search: { mediaType?: MediaType }) => queryOptions({
    queryKey: ["userStats", username, search],
    queryFn: () => getUserStats({ data: { username, ...search } }),
});


export const featureVotesOptions = queryOptions({
    queryKey: ["featureVotes"],
    queryFn: () => getFeatureVotes(),
});


export const activityQueryOptions = (username: string, search: { year: string, month: string }) => {
    return queryOptions({
        queryKey: ["userStats-activity", username, search.year, search.month],
        queryFn: () => getMonthlyActivity({ data: { username, ...search } }),
    })
}


export const sectionActivityQueryOptions = (username: string, params: {
    year: string;
    month: string;
    mediaType: MediaType | "all";
    section: "completed" | "progressed" | "redo"
}) => {
    return infiniteQueryOptions({
        queryKey: ["userStats-section", username, params.year, params.month, params.mediaType, params.section],
        queryFn: ({ pageParam = 0 }) => getSectionActivity({
            data: {
                username,
                limit: 24,
                offset: pageParam,
                section: params.section,
                year: Number(params.year),
                month: Number(params.month),
                mediaType: params.mediaType === "all" ? undefined : params.mediaType,
            }
        }),
        staleTime: Infinity,
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) return undefined;
            return allPages.reduce((acc, page) => acc + page.items.length, 0);
        },
    });
}


export const tagNamesOptions = (mediaType: MediaType, isOpen: boolean) => queryOptions({
    queryKey: ["tagNames", mediaType] as const,
    queryFn: () => getUserTagNames({ data: { mediaType } }),
    enabled: isOpen,
});


export const editMediaDetailsOptions = (mediaType: MediaType, mediaId: number) => queryOptions({
    queryKey: ["editDetails", mediaType, mediaId],
    queryFn: () => getMediaDetailsToEdit({ data: { mediaType, mediaId } }),
    gcTime: 0,
    staleTime: 0,
});


export const jobDetailsOptions = (mediaType: MediaType, job: JobType, name: string, search: SearchType) => queryOptions({
    queryKey: ["jobDetails", mediaType, job, name, search],
    queryFn: () => getJobDetails({ data: { mediaType, job, name, search } }),
});


export const platformStatsOptions = (search: { mediaType?: MediaType }) => queryOptions({
    queryKey: ["platformStats", search],
    queryFn: () => getPlatformStats({ data: search }),
});


export const userCollectionsOptions = (username: string, mediaType?: MediaType) => queryOptions({
    queryKey: ["collections", "user", username, mediaType] as const,
    queryFn: () => getUserCollections({ data: { username, mediaType } }),
});


export const collectionDetailsReadOptions = (collectionId: number) => queryOptions({
    queryKey: ["collections", "details", "read", collectionId] as const,
    queryFn: () => getReadCollectionDetails({ data: { collectionId } }),
});


export const collectionDetailsEditOptions = (collectionId: number) => queryOptions({
    queryKey: ["collections", "details", "edit", collectionId] as const,
    queryFn: () => getEditCollectionDetails({ data: { collectionId } }),
});


export const communityCollectionsOptions = (search: CommunitySearch) => queryOptions({
    queryKey: ["collections", "community", search] as const,
    queryFn: () => getCommunityCollections({ data: search }),
});


export const suggestBookCoverOptions = (mediaName: string, coverUrl: string, enabled: boolean) => {
    return queryOptions({
        queryKey: ["openLibraryCover", mediaName] as const,
        queryFn: () => {
            return new Promise<"available" | "missing">((resolve) => {
                const img = new Image();
                img.onload = () => resolve("available");
                img.onerror = () => resolve("missing");
                img.src = coverUrl;
            });
        },
        staleTime: 10 * 60 * 1000,
        enabled: enabled && Boolean(coverUrl),
    });
};
