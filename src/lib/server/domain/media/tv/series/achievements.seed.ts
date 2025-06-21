import {MediaType} from "@/lib/server/utils/enums";


export const seriesAchievements = [
    {
        codeName: "completed_series",
        name: "Cinephile Marathoner",
        description: "Awarded for completing series, because real life has too few explosions and car chases.",
        mediaType: MediaType.ANIME,
        tiers: [
            { criteria: { count: 100 }, difficulty: 1 },
            { criteria: { count: 400 }, difficulty: 2 },
            { criteria: { count: 800 }, difficulty: 3 },
            { criteria: { count: 1500 }, difficulty: 4 },
        ]
    },
] as const;


export type SeriesAchCodeName = typeof seriesAchievements[number]["codeName"];
