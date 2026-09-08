import {queryOptions} from "@tanstack/react-query";
import type {TvMediaType} from "@/lib/utils/enums";
import {getTvSeasons} from "@/lib/server/functions/tv-seasons";

export const tvSeasonsOptions = (mediaType: TvMediaType, mediaId: number, userId: number) => queryOptions({
    queryKey: ["tvSeasons", mediaType, mediaId, userId] as const,
    queryFn: () => getTvSeasons({ data: { mediaType, mediaId, userId } }),
    staleTime: 0,
});
