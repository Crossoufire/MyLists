import {ApiProviderType, JobType, MediaType, Status} from "@/lib/utils/enums";
import {defineMediaDefinition} from "@/lib/media-definitions/base/media.definition";


export const gamesDefinition = defineMediaDefinition({
    statuses: [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_PLAY],
    identity: {
        mediaType: MediaType.GAMES,
    },
    externalSearch: {
        provider: ApiProviderType.IGDB,
    },
    terminology: {
        entry: {
            plural: "games",
            singular: "game",
        },
    },
    progress: {
        inputStep: 0.25,
        unit: {
            short: "h.",
            plural: "hours",
            singular: "hour",
            long: "Hours Played",
        },
        timing: {
            kind: "stored-minutes",
            minutesPerInputUnit: 60,
        },
    },
    statistics: {
        affinities: [
            { key: "developersStats", label: "Developers", job: JobType.CREATOR },
            { key: "platformsStats", label: "Platforms" },
            { key: "genresStats", label: "Genres" },
            { key: "publishersStats", label: "Publishers" },
            { key: "enginesStats", label: "Engines" },
            { key: "perspectivesStats", label: "Perspectives" },
        ],
        repeat: {
            label: "Replays",
            rateLabel: "Replay rate",
        },
        timeComparison: {
            referenceHours: 32,
            secondaryHours: 8,
            secondaryLabel: "full eight-hour gaming sessions",
            referenceLabel: "playthroughs of GTA V’s main story",
        },
        durationDistribution: {
            unit: "h",
            rangeMode: "integer",
            label: "Playthrough Duration Distribution",
        },
    },
});
