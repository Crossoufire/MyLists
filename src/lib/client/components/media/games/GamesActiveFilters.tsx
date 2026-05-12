import {JobType} from "@/lib/utils/enums";
import {SheetFilterObject} from "@/lib/types/media-list.types";


export const getGamesActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "companies", title: "Companies", type: "search", job: JobType.CREATOR },
        {
            key: "platforms", title: "Platforms", type: "checkbox",
            getItems: (data) => data.platforms,
        },
    ];
}
