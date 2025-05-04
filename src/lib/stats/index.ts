import {tvData} from "@/lib/stats/tv";
import {booksData} from "@/lib/stats/books";
import {gamesData} from "@/lib/stats/games";
import {mangaData} from "@/lib/stats/manga";
import {globalData} from "@/lib/stats/global";
import {moviesData} from "@/lib/stats/movies";
import {MediaType} from "@/lib/server/utils/enums";
import type {ApiData, DataToLoadProps, StatSection} from "@/lib/stats/types";


const mediaDataFunctions: { [key in MediaType]?: (apiData: ApiData) => StatSection[]; } = {
    [MediaType.ANIME]: tvData,
    [MediaType.SERIES]: tvData,
    [MediaType.BOOKS]: booksData,
    [MediaType.GAMES]: gamesData,
    [MediaType.MANGA]: mangaData,
    [MediaType.MOVIES]: moviesData,
};


export const dataToLoad = ({ mediaType, apiData, forUser = false }: DataToLoadProps): StatSection[] => {
    if (!mediaType) {
        return globalData({ apiData, forUser });
    }

    const dataFunction = mediaDataFunctions[mediaType];
    if (dataFunction) {
        return dataFunction(apiData);
    }

    return [];
};
