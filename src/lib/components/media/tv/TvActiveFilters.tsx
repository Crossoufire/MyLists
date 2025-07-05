import {JobType} from "@/lib/server/utils/enums";
import {FilterConfig} from "@/lib/components/types";
import {getLangCountryName} from "@/lib/utils/functions";


export const getTvActiveFilters = (): FilterConfig[] => {
    return [
        { key: "actors", title: "Actors", type: "search", job: JobType.ACTOR },
        { key: "creators", title: "Creators", type: "search", job: JobType.CREATOR },
        { key: "platforms", title: "Networks", type: "search", job: JobType.PLATFORM },
        {
            key: "langs", title: "Countries", type: "checkbox",
            getItems: (data) => data.langs,
            renderLabel: (name) => getLangCountryName(name, "region"),
        },
    ];
}
