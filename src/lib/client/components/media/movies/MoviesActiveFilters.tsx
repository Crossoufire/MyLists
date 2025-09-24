import {JobType} from "@/lib/utils/enums";
import {SheetFilterObject} from "@/lib/types/base.types";
import {getLangCountryName} from "@/lib/utils/functions";


export const getMoviesActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "actors", title: "Actors", type: "search", job: JobType.ACTOR },
        { key: "directors", title: "Directors", type: "search", job: JobType.CREATOR },
        {
            key: "langs", title: "Languages", type: "checkbox",
            getItems: (data) => data.langs,
            renderLabel: (name) => getLangCountryName(name, "language"),
        },
    ];
}
