import {JobType} from "@/lib/utils/enums";
import {SheetFilterObject} from "@/lib/types/base.types";

import {formatLocaleName} from "@/lib/utils/formating";


export const getTvActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "actors", title: "Actors", type: "search", job: JobType.ACTOR },
        { key: "creators", title: "Creators", type: "search", job: JobType.CREATOR },
        { key: "networks", title: "Networks", type: "search", job: JobType.PLATFORM },
        {
            key: "langs", title: "Countries", type: "checkbox",
            getItems: (data) => data.langs,
            renderLabel: (name) => formatLocaleName(name, "region"),
        },
    ];
}
