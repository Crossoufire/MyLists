import {MediaType, Status} from "@/lib/utils/enums";


export const statusUtils = {
    getNoPlanTo: (): Status[] => [Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ],
    byMediaType: (mediaType: MediaType) => {
        switch (mediaType) {
            case MediaType.SERIES:
            case MediaType.ANIME:
                return [Status.WATCHING, Status.COMPLETED, Status.ON_HOLD, Status.RANDOM, Status.DROPPED, Status.PLAN_TO_WATCH];
            case MediaType.MOVIES:
                return [Status.COMPLETED, Status.PLAN_TO_WATCH];
            case MediaType.GAMES:
                return [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_PLAY];
            case MediaType.BOOKS:
                return [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ];
            case MediaType.MANGA:
                return [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ];
        }
    },
};


export const mediaTypeUtils = {
    getTypesForNotifications: (): MediaType[] => [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES],
    getComingNextTypes: (): MediaType[] => [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.GAMES],
};


export const getPlaytimeList = () => {
    const ranges = [
        { start: 0, end: 50, step: 5 },
        { start: 60, end: 100, step: 10 },
        { start: 125, end: 300, step: 25 },
        { start: 350, end: 600, step: 50 },
        { start: 700, end: 1000, step: 100 },
        { start: 1500, end: 3000, step: 500 },
        { start: 4000, end: 10000, step: 1000 }
    ];

    const specialCases = [0, 2];

    return [
        ...specialCases,
        ...ranges.flatMap(({ start, end, step }) =>
            Array.from(
                { length: Math.floor((end - start) / step) + 1 },
                (_, i) => start + i * step,
            )
        ).filter(value => !specialCases.includes(value))
    ];
};


export const getRedoList = () => {
    return [...Array(11).keys()];
};
