import {JobType} from "@/lib/server/utils/enums";
import {getLangCountryName} from "@/lib/utils/functions";
import {SheetFilterObject} from "@/lib/types/base.types";


export const getTvActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "actors", title: "Actors", type: "search", job: JobType.ACTOR },
        { key: "creators", title: "Creators", type: "search", job: JobType.CREATOR },
        { key: "networks", title: "Networks", type: "search", job: JobType.PLATFORM },
        {
            key: "langs", title: "Countries", type: "checkbox",
            getItems: (data) => data.langs,
            renderLabel: (name) => getLangCountryName(name, "region"),
        },
    ];
}
