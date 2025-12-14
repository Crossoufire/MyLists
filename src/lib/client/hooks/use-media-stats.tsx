import {MediaType} from "@/lib/utils/enums";
import {queryOptions} from "@tanstack/react-query";
import {Timeframe} from "@/lib/client/social-card/types";
import {getUserStatsCard} from "@/lib/server/functions/user-stats";


async function searchMedia(mediaType: MediaType, query: string): Promise<{ mediaId: number; name: string; mediaCover: string }[]> {
    await new Promise((r) => setTimeout(r, 800));

    const mockResults: Record<MediaType | "user", { mediaId: number; name: string; mediaCover: string }[]> = {
        series: [
            { mediaId: 1, name: "Breaking Bad", mediaCover: "/posters/bb.jpg" },
            { mediaId: 2, name: "The Last of Us", mediaCover: "/posters/tlou.jpg" },
        ],
        anime: [
            { mediaId: 1, name: "Attack on Titan", mediaCover: "/posters/aot.jpg" },
            { mediaId: 2, name: "Jujutsu Kaisen", mediaCover: "/posters/jjk.jpg" },
        ],
        movies: [
            { mediaId: 1, name: "Dune: Part Two", mediaCover: "/posters/dune2.jpg" },
            { mediaId: 2, name: "Oppenheimer", mediaCover: "/posters/oppenheimer.jpg" },
            { mediaId: 3, name: "The Batman", mediaCover: "/posters/batman.jpg" },
        ],
        games: [
            { mediaId: 1, name: "Elden Ring", mediaCover: "/posters/eldenring.jpg" },
            { mediaId: 2, name: "Baldur's Gate 3", mediaCover: "/posters/bg3.jpg" },
        ],
        books: [
            { mediaId: 1, name: "Mistborn", mediaCover: "/posters/mistborn.jpg" },
            { mediaId: 2, name: "Dune", mediaCover: "/posters/dunebook.jpg" },
        ],
        manga: [
            { mediaId: 1, name: "One Piece", mediaCover: "/posters/onepiece.jpg" },
            { mediaId: 2, name: "Chainsaw Man", mediaCover: "/posters/csm.jpg" },
        ],
        user: [],
    };

    const results = mockResults[mediaType] ?? [];

    if (!query) return results;

    return results.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));
}


export const mediaStatsOptions = (mediaType: MediaType, timeframe: Timeframe) => queryOptions({
    queryKey: ["mediaStats", mediaType, timeframe],
    queryFn: () => getUserStatsCard({ data: { mediaType } }),
    staleTime: 10 * 60 * 1000,
});


export const mediaSearchOptions = (mediaType: MediaType, query: string) => queryOptions({
    queryKey: ["mediaSearch", mediaType, query],
    queryFn: () => searchMedia(mediaType, query),
    staleTime: 5 * 60 * 1000,
    enabled: query.length >= 2,
});
